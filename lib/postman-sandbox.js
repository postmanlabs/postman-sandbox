const _ = require('lodash'),
    uuid = require('./vendor/uuid'),
    UniversalVM = require('uvm'),
    PostmanEvent = require('postman-collection').Event,
    teleportJS = require('teleport-javascript'),

    TO_WAIT_BUFFER = 500, // time to wait for sandbox to declare timeout
    CONSOLE_EVENT_NAME = 'execution.console',
    EXECUTION_TIMEOUT_ERROR_MESSAGE = 'sandbox not responding',
    BRIDGE_DISCONNECTING_ERROR_MESSAGE = 'sandbox: execution interrupted, bridge disconnecting.';

class PostmanSandbox extends UniversalVM {
    constructor () {
        super();

        this._executing = {};
        this.isReady = false;
        this.hasTimedOut = false;
    }

    initialize (initOptions, connectOptions, callback) {
        // ensure options is an object and is shallow cloned
        this.initOptions = _.assign({}, initOptions);
        this.connectOptions = _.assign({}, connectOptions);

        this.debug = Boolean(this.connectOptions.debug);

        // set the dispatch timeout of UVM based on what is set in options unless original options sends the same
        _.isFinite(this.connectOptions.timeout) && (this.executionTimeout = this.connectOptions.timeout);

        super.connect(this.connectOptions, (err, context) => {
            if (err) { return callback(err); }

            this.once('initialize', (err) => {
                this.isReady = true;
                this.hasTimedOut = false;

                this.on(CONSOLE_EVENT_NAME, (cursor, level, args) => {
                    if (this.connectOptions.serializeLogs) {
                        return this.emit('console', cursor, level, args);
                    }

                    this.emit('console', cursor, level, ...teleportJS.parse(args));
                });

                // eslint-disable-next-line n/callback-return
                callback(err, context);
                context = null;
            });

            this.dispatch('initialize', this.initOptions);
        });
    }

    ping (callback) {
        const packet = uuid(),
            start = Date.now();

        this.once('pong', (echo) => {
            callback((echo !== packet ? new Error('sandbox: ping packet mismatch') : null), Date.now() - start, packet);
        });

        this.dispatch('ping', packet);
    }

    /**
     * @param {Event|String} target - can optionally be the code to execute
     * @param {Object} options -
     * @param {String} options.id -
     * @param {Boolean} options.debug -
     * @param {Number} options.timeout -
     * @param {Object} options.cursor -
     * @param {Object} options.context -
     * @param {Boolean} options.serializeLogs -
     * @param {Function} callback -
     */
    execute (target, options, callback) {
        if (_.isFunction(options) && !callback) {
            callback = options;
            options = null;
        }

        !_.isObject(options) && (options = {});
        !_.isFunction(callback) && (callback = _.noop);

        // if the target is simple code, we make a generic event out of it
        if (_.isString(target) || _.isArray(target)) {
            target = new PostmanEvent({ script: target });
        }
        // if target is not a code and instead is not something that can be cast to an event, it is definitely an error
        else if (!_.isObject(target)) {
            return callback(new Error('sandbox: no target provided for execution'));
        }

        const id = _.isString(options.id) ? options.id : uuid(),
            executionEventName = 'execution.result.' + id,
            executionTimeout = _.get(options, 'timeout', this.executionTimeout),
            cursor = _.clone(_.get(options, 'cursor', {})), // clone the cursor as it travels through IPC for mutation
            resolvedPackages = _.get(options, 'resolvedPackages'),
            debugMode = _.has(options, 'debug') ? options.debug : this.debug,

            // send the code to the sandbox to be intercepted and executed
            dispatchExecute = () => {
                this.dispatch('execute', id, target, _.get(options, 'context', {}), {
                    cursor: cursor,
                    debug: debugMode,
                    timeout: executionTimeout,
                    resolvedPackages: resolvedPackages,
                    legacy: _.get(options, 'legacy')
                });
            };

        let waiting;

        // set the execution id in cursor
        cursor.execution = id;

        // set execution timeout and store the interrupt in a global object (so that we can clear during dispose)
        // force trigger of the `execution.${id}` event so that the normal error flow is taken
        this._executing[id] = _.isFinite(executionTimeout) ? (waiting = setTimeout(() => {
            waiting = null;
            this.hasTimedOut = true;
            this.emit(executionEventName, new Error(EXECUTION_TIMEOUT_ERROR_MESSAGE));
        }, executionTimeout + TO_WAIT_BUFFER)) : null;

        // @todo decide how the results will return in a more managed fashion
        // listen to this once, so that subsequent calls are simply dropped. especially during timeout and other
        // errors
        this.once(executionEventName, (err, result) => {
            waiting && (waiting = clearTimeout(waiting)); // clear timeout interrupt
            if (Object.hasOwn(this._executing, id)) { // clear any pending timeouts
                this._executing[id] && clearTimeout(this._executing[id]);
                delete this._executing[id];
            }

            this.emit('execution', err, id, result);

            // Dispose the current context to
            // interrupt the execution when timed out
            waiting === null && this.dispose();

            callback(err, result);
        });

        if (this.isReady || !this.hasTimedOut) {
            dispatchExecute();

            return;
        }

        // Re-initialize the sandbox if it is not already.This can
        // happen if a previous execution was interrupted due to a timeout.
        this.initialize(this.initOptions, this.connectOptions, (err) => {
            if (err) { return callback(err); }
            dispatchExecute();
        });
    }

    dispose (callback) {
        this.isReady = false;

        _.forEach(this._executing, (irq, id) => {
            irq && clearTimeout(irq);

            // send an abort event to the sandbox so that it can do cleanups
            this.dispatch('execution.abort.' + id);

            // even though sandbox could bubble the result event upon receiving abort, that would reduce
            // stability of the system in case sandbox was unresponsive.
            this.emit('execution.result.' + id, new Error(BRIDGE_DISCONNECTING_ERROR_MESSAGE));
        });

        this.removeAllListeners(CONSOLE_EVENT_NAME);
        this.disconnect(() => {
            typeof callback === 'function' && callback();
        });
    }
}

module.exports = PostmanSandbox;
