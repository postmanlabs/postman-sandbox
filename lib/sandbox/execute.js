var _ = require('lodash'),
    Scope = require('uniscope'),
    PostmanEvent = require('postman-collection').Event,
    PostmanAPI = require('./pmapi'),
    Execution = require('./execution'),
    PostmanConsole = require('./console'),
    StubTimers = require('./stub-timers'),
    legacy = require('./postman-legacy-interface'),

    EXECUTION_RESULT_EVENT_BASE = 'execution.result.',
    EXECUTION_ERROR_EVENT = 'execution.error';

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
            // if a console is sent, we use it. otherwise this also prevents erroneous referencing to any console inside
            // this closure.
            console = new PostmanConsole(bridge, cursor, options.debug && glob.console),

            // extract the code from event. The event can be the code itself and we know that if the event is of type
            // string.
            code = _.isFunction(event.script && event.script.toSource) && event.script.toSource(),

            execution = new Execution(event, context, options),
            executionEventName = EXECUTION_RESULT_EVENT_BASE + id;

        // if there is no code, then no point bubbling anything up
        if (!(code && _.isString(code))) {
            return bridge.dispatch(executionEventName, null, execution);
        }

        // prepare legacy environment
        legacy.setup(scope, execution, options);

        // prepare the scope's environment variables
        scope.import(new StubTimers(console));
        scope.import({
            console: console,
            pm: new PostmanAPI(bridge, execution)
        });

        scope.exec(code, function (err) {
            // fire extra execution error event
            err && bridge.dispatch(EXECUTION_ERROR_EVENT, cursor, err, id);
            bridge.dispatch(executionEventName, err, execution);
        });
    });
};
