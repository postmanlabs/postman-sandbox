var _ = require('lodash'),
    Scope = require('uniscope'),
    PostmanEvent = require('postman-collection').Event,
    PostmanAPI = require('./pmapi'),
    Execution = require('./execution'),
    PostmanConsole = require('./console'),
    PostmanTimers = require('./timers'),
    legacy = require('./postman-legacy-interface'),

    EXECUTION_RESULT_EVENT_BASE = 'execution.result.',
    EXECUTION_ERROR_EVENT = 'execution.error',
    EXECUTION_ERROR_EVENT_BASE = 'execution.error.',

    NONLEGACY_SANDBOX_MARKERS = {
        '"use sandbox2";': true,
        '\'use sandbox2\';': true
    };

module.exports = function (bridge, glob) {
    var // @note we use a common scope for all executions. this causes issues when scripts are run inside the sandbox
        // in parallel, but we still use this way for the legacy "persistent" behaviour needed in environment
        scope = Scope.create({
            eval: true,
            ignore: ['require'],
            block: ['bridge']
        });

    /**
     * @param {String} id
     * @param {Event} event
     * @param {Object} context
     * @param {Object} options
     * @param {Boolean=} [options.debug]
     * @param {Object=} [options.cursor]
     * @param {Number=} [options.timeout]
     *
     * @note
     * options also take in legacy properties: _itemId, _itemName
     */
    bridge.on('execute', function (id, event, context, options) {
        if (!(id && _.isString(id))) {
            return bridge.dispatch('error', new Error('sandbox: execution identifier parameter(s) missing'));
        }

        !options && (options = {});
        !context && (context = {});
        event = (new PostmanEvent(event));

        var cursor = options.cursor,

            // extract the code from event. The event can be the code itself and we know that if the event is of type
            // string.
            code = _.isFunction(event.script && event.script.toSource) && event.script.toSource(),

            execution = new Execution(id, event, context, options),
            executionEventName = EXECUTION_RESULT_EVENT_BASE + id,

            waiting,
            timers,
            done; // fn

        // create a function to neatly exit execution
        done = function (err) {
            waiting && (waiting = clearTimeout(waiting)); // stop any new timers from being added
            timers && timers.seal(); // do not allow any more timers
            bridge.dispatch(executionEventName, err || null, execution); // fire the execution completion event
        };

        // if there is no code, then no point bubbling anything up
        if (!(code && _.isString(code))) {
            return done();
        }

        // start by resetting the scope
        scope.reset();

        if (NONLEGACY_SANDBOX_MARKERS[code.substr(0, 15)]) {
            // ensure any previously added global variables from legacy are torn down. side-effect is that if user
            // explicitly created global variables with same name as legacy ones, they will be torn down too!
            // for that reason, the setup function tags the scope and avoids tearing down an scope that was never setup
            legacy.teardown(scope);
        }
        else {
            // prepare legacy environment, which adds a tonne of global variables
            legacy.setup(scope, execution, options);
        }

        // create the controlled timers
        timers = new PostmanTimers(null, function (err) {
            if (!err) { return; }
            bridge.dispatch(EXECUTION_ERROR_EVENT_BASE + id, cursor, err);
            bridge.dispatch(EXECUTION_ERROR_EVENT, cursor, err);
        }, function () {
            execution.return.async = true; // on any timer start, mark the same
        }, done);

        // if a timeout is set, we must ensure that all pending timers are cleared and an execution timeout event is
        // trigerred.
        _.isFinite(options.timeout) && (waiting = setTimeout(function () {
            timers.clearAll(); // if there are existing timers, clear all

            done(new Error('sandbox: ' +
                (execution.return.async ? 'asyncronous' : 'syncronous') + ' script execution timeout'));
        }, options.timeout));

        // prepare the scope's environment variables
        scope.import({
            Buffer: require('buffer').Buffer,
            // if a console is sent, we use it. otherwise this also prevents erroneous referencing to any console inside
            // this closure.
            console: new PostmanConsole(bridge, cursor, options.debug && glob.console),
            pm: new PostmanAPI(bridge, execution),
            // import the timers
            setTimeout: timers.setTimeout,
            setInterval: timers.setInterval,
            setImmediate: timers.setImmediate,
            clearTimeout: timers.clearTimeout,
            clearInterval: timers.clearInterval,
            clearImmediate: timers.clearImmediate
        });

        scope.exec(code, function (err) {
            // fire extra execution error event
            if (err) {
                bridge.dispatch(EXECUTION_ERROR_EVENT_BASE + id, cursor, err);
                bridge.dispatch(EXECUTION_ERROR_EVENT, cursor, err);
            }

            // if timers are running, we do not need to proceed with any logic of completing execution. instead we wait
            // for timer completion callback to fire
            if (timers.queueLength()) {
                return;
            }

            // ensure that we set this to false so that if any timer was set, but cleared, the flag does
            // not become misleading and then fire completion callback
            execution.return.async = false;
            done(err);
        });
    });
};
