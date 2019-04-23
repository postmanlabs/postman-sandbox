var _ = require('lodash'),
    Scope = require('uniscope'),
    PostmanEvent = require('postman-collection').Event,
    Execution = require('./execution'),
    PostmanConsole = require('./console'),
    PostmanTimers = require('./timers'),
    PostmanAPI = require('./pmapi'),
    PostmanCookieStore = require('./cookie-store'),

    EXECUTION_RESULT_EVENT_BASE = 'execution.result.',
    EXECUTION_REQUEST_EVENT_BASE = 'execution.request.',
    EXECUTION_ERROR_EVENT = 'execution.error',
    EXECUTION_ERROR_EVENT_BASE = 'execution.error.',
    EXECUTION_ABORT_EVENT_BASE = 'execution.abort.',
    EXECUTION_RESPONSE_EVENT_BASE = 'execution.response.',
    EXECUTION_COOKIES_EVENT_BASE = 'execution.cookies.',

    executeContext = require('./execute-context');

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

        var executionEventName = EXECUTION_RESULT_EVENT_BASE + id,
            executionRequestEventName = EXECUTION_REQUEST_EVENT_BASE + id,
            errorEventName = EXECUTION_ERROR_EVENT_BASE + id,
            abortEventName = EXECUTION_ABORT_EVENT_BASE + id,
            responseEventName = EXECUTION_RESPONSE_EVENT_BASE + id,
            cookiesEventName = EXECUTION_COOKIES_EVENT_BASE + id,

            // extract the code from event. The event can be the code itself and we know that if the event is of type
            // string.
            code = _.isFunction(event.script && event.script.toSource) && event.script.toSource(),
            // create the execution object
            execution = new Execution(id, event, context, options),

            waiting,
            timers;

        // create the controlled timers
        timers = new PostmanTimers(null, function (err) {
            if (err) { // propagate the error out of sandbox
                bridge.dispatch(errorEventName, options.cursor, err);
                bridge.dispatch(EXECUTION_ERROR_EVENT, options.cursor, err);
            }
        }, function () {
            execution.return.async = true;
        }, function (err, dnd) {
            // clear timeout tracking timer
            waiting && (waiting = clearTimeout(waiting));

            // do not allow any more timers
            if (timers) {
                timers.seal();
                timers.clearAll();
            }

            // remove listener of disconnection event
            bridge.off(abortEventName);
            bridge.off(responseEventName);

            if (err) { // fire extra execution error event
                bridge.dispatch(errorEventName, options.cursor, err);
                bridge.dispatch(EXECUTION_ERROR_EVENT, options.cursor, err);
            }

            // fire the execution completion event
            (dnd !== true) && bridge.dispatch(executionEventName, err || null, execution);
        });
        // if a timeout is set, we must ensure that all pending timers are cleared and an execution timeout event is
        // triggered.
        _.isFinite(options.timeout) && (waiting = setTimeout(function () {
            timers.terminate(new Error('sandbox: ' +
                (execution.return.async ? 'asynchronous' : 'synchronous') + ' script execution timeout'));
        }, options.timeout));

        // if an abort event is sent, compute cleanup and complete
        bridge.on(abortEventName, function () {
            timers.terminate(null, true);
        });

        // handle response event from outside sandbox
        bridge.on(responseEventName, function (id, err, res, history) {
            timers.clearEvent(id, err, res, history);
        });

        // handle cookies event from outside sandbox
        bridge.on(cookiesEventName, function (id, err, res) {
            timers.clearEvent(id, err, res);
        });

        // send control to the function that executes the context and prepares the scope
        executeContext(scope, code, execution,
            // if a console is sent, we use it. otherwise this also prevents erroneous referencing to any console
            // inside this closure.
            (new PostmanConsole(bridge, options.cursor, options.debug && glob.console)),
            timers,
            (new PostmanAPI(bridge, execution, function (request, callback) {
                var eventId = timers.setEvent(callback);
                bridge.dispatch(executionRequestEventName, options.cursor, id, eventId, request);
            }, new PostmanCookieStore(id, bridge, timers))));
    });
};
