var _ = require('lodash'),
    inherits = require('inherits'),
    uuid = require('uuid'),
    UniversalVM = require('uvm'),
    PostmanEvent = require('postman-collection').Event,
    bootcode = require('./bootcode'),

    EXECUTION_TIMEOUT_ERROR_MESSAGE = 'sandbox: execution timeout',
    BRIDGE_DISCONNECTING_ERROR_MESSAGE = 'sandbox: execution interrupted, bridge disconnecting.',
    PostmanSandbox;


PostmanSandbox = function PostmanSandbox (options, callback) {
    options = _.assign({}, options); // ensure options is an object and is shallow cloned
    this.executing = {};
    this.debug = Boolean(options.debug);

    // set the dispatch timeout of UVM based on what is set in options unless original options sends the same
    _.isFinite(options.timeout) && (options.dispatchTimeout = this.executionTimeout = options.timeout);

    UniversalVM.call(this, options, function (err, context) {
        if (err) { return callback(err); }
        context.ping(function (err) {
            callback(err, context);
            context = null;
        });
    });
};

inherits(PostmanSandbox, UniversalVM);

_.assign(PostmanSandbox.prototype, {
    ping: function (callback) {
        var packet = uuid(),
            start = Date.now();

        this.once('pong', function (echo) {
            callback((echo !== packet ? new Error('sandbox: ping packet mismatch') : null), Date.now() - start, packet);
        });

        this.dispatch('ping', packet);
    },

    /**
     * @param {Event|String} target - can optionally be the code to execute
     * @param {Object} options
     * @param {String} options.id
     * @param {Boolean} options.debug
     * @param {Number} options.timeout
     * @param {Object} options.cursor
     * @param {Object} options.context
     * @param {Function} callback
     */
    execute: function (target, options, callback) {
        if (_.isFunction(options) && !callback) {
            callback = options;
            options = null;
        }

        !_.isObject(options) && (options = {});
        options.debug = this.debug; // @todo make this overrideable using options

        // if the target is simple code, we make a generic event out of it
        if (_.isString(target) || _.isArray(target)) {
            target = new PostmanEvent({
                script: target
            });
        }
        // if target is not a code and instead is not something that can be cast to an event, it is definitely an error
        else if (!_.isObject(target)) {
            return callback(new Error('sandbox: no target provided for execution'));
        }

        var id = _.isString(options.id) ? options.id : uuid(),
            executionEventName = 'execution.result.' + id,
            executionTimeout = _.get(options, 'timeout', this.executionTimeout),
            cursor = _.clone(_.get(options, 'cursor', {})); // clone the cursor as it travels through IPC for mutation

        // set the execution id in cursor
        cursor.execution = id;

        // set execution timeout and store the interrupt in a global object (so that we can clear during dispose)
        // force trigger of the `execution.${id}` event so that the normal error flow is taken
        this.executing[id] = _.isFinite(executionTimeout) ? (setTimeout(this.emit.bind(this, executionEventName,
            new Error(EXECUTION_TIMEOUT_ERROR_MESSAGE)), executionTimeout)) : null;

        // @todo decide how the results will return in a more managed fashion
        // listen to this once, so that subsequent calls are simply dropped. especially during timeout and other
        // errors
        this.once(executionEventName, function (err, result) {
            if (this.executing.hasOwnProperty(id)) { // clear any pending timeouts
                this.executing[id] && clearTimeout(this.executing[id]);
                delete this.executing[id];
            }

            this.emit('execution', err, id, result);
            callback(err, result);
        });

        // send the code to the sandbox to be intercepted and executed
        this.dispatch('execute', id, target, _.get(options, 'context', {}), {
            cursor: cursor,
            debug: _.get(options, 'debug'),
            timeout: executionTimeout,
            legacy: _.get(options, 'legacy')
        });
    },

    dispose: function () {
        var self = this;

        _.forEach(self.executing, function (irq, id) {
            irq && clearTimeout(irq);
            self.emit(`execution.result.${id}`, new Error(BRIDGE_DISCONNECTING_ERROR_MESSAGE));
        });

        self.disconnect();
        self = null;
    }
});

_.assign(PostmanSandbox, {
    create: function (options, callback) {
        return new PostmanSandbox(options, callback);
    }
});

module.exports = {
    /**
     * Creates a new instance of sandbox from the options that have been provided
     * @param {Object=} [options]
     * @param {Function} callback
     */
    createContext: function (options, callback) {
        if (_.isFunction(options) && !callback) {
            callback = options;
            options = {};
        }

        options = _.clone(options);
        bootcode(function (err, code) {
            if (err) { return callback(err); }
            if (!code) { return callback(new Error('sandbox: bootcode missing!')); }

            options.bootCode = code; // assign the code in options
            PostmanSandbox.create(options, callback);
        });
    }
};
