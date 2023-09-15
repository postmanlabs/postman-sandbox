const _ = require('lodash'),
    chai = require('chai'),
    Ajv = require('ajv'),
    Scope = require('uniscope'),
    sdk = require('postman-collection'),
    PostmanEvent = sdk.Event,
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
    EXECUTION_ASSERTION_EVENT = 'execution.assertion',
    EXECUTION_ASSERTION_EVENT_BASE = 'execution.assertion.',

    executeContext = require('./execute-context'),
    dispatchEvent = require('./dispatch-event');

module.exports = function (bridge, glob) {
    // @note we use a common scope for all executions. this causes issues when scripts are run inside the sandbox
    // in parallel, but we still use this way for the legacy "persistent" behaviour needed in environment
    const scope = Scope.create({
        eval: true,
        ignore: ['require'],
        block: ['bridge']
    });

    // For caching required information provided during
    // initialization which will be used during execution
    let initializationOptions = {},
        initializeExecution;

    /**
     * @param {Object} options
     * @param {String} [options.template]
     * @param {Boolean} [options.disableLegacyAPIs]
     * @param {Array.<String>} [options.disabledAPIs]
     */
    bridge.once('initialize', ({ template, ...initOptions }) => {
        initializationOptions = initOptions || {};

        // If no custom template is provided, go ahead with the default steps
        if (!template) {
            chai.use(require('chai-postman')(sdk, _, Ajv));

            return dispatchEvent(bridge, null, 'initialize');
        }

        const _module = { exports: {} },
            scope = Scope.create({
                eval: true,
                ignore: ['require'],
                block: ['bridge']
            });

        scope.import({
            Buffer: require('buffer').Buffer,
            module: _module
        });

        scope.exec(template, (err) => {
            if (err) {
                return dispatchEvent(bridge, null, 'initialize', err);
            }

            const { chaiPlugin, initializeExecution: setupExecution } = (_module && _module.exports) || {};

            if (_.isFunction(chaiPlugin)) {
                chai.use(chaiPlugin);
            }

            if (_.isFunction(setupExecution)) {
                initializeExecution = setupExecution;
            }

            dispatchEvent(bridge, null, 'initialize');
        });
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
            return dispatchEvent(bridge, null, 'error',
                new Error('sandbox: execution identifier parameter(s) missing'));
        }

        !options && (options = {});
        !context && (context = {});
        event = (new PostmanEvent(event));

        const executionEventName = EXECUTION_RESULT_EVENT_BASE + id,
            executionRequestEventName = EXECUTION_REQUEST_EVENT_BASE + id,
            errorEventName = EXECUTION_ERROR_EVENT_BASE + id,
            abortEventName = EXECUTION_ABORT_EVENT_BASE + id,
            responseEventName = EXECUTION_RESPONSE_EVENT_BASE + id,
            cookiesEventName = EXECUTION_COOKIES_EVENT_BASE + id,
            assertionEventName = EXECUTION_ASSERTION_EVENT_BASE + id,

            // extract the code from event. The event can be the code itself and we know that if the event is of type
            // string.
            code = _.isFunction(event.script && event.script.toSource) && event.script.toSource(),
            // create the execution object
            execution = new Execution(id, event, context, { ...options, initializeExecution }),

            /**
             * Dispatch assertions from `pm.test` or legacy `test` API.
             *
             * @private
             * @param {Object[]} assertions -
             * @param {String} assertions[].name -
             * @param {Number} assertions[].index -
             * @param {Object} assertions[].error -
             * @param {Boolean} assertions[].async -
             * @param {Boolean} assertions[].passed -
             * @param {Boolean} assertions[].skipped -
             */
            dispatchAssertions = function (assertions) {
                // Legacy `test` API accumulates all the assertions and dispatches at once
                // whereas, `pm.test` dispatch on every single assertion.
                // For compatibility, dispatch the single assertion as an array.
                !Array.isArray(assertions) && (assertions = [assertions]);

                dispatchEvent(bridge, execution, assertionEventName, options.cursor, assertions);
                dispatchEvent(bridge, execution, EXECUTION_ASSERTION_EVENT, options.cursor, assertions);
            };

        let waiting,
            timers;

        execution.return.async = false;

        // create the controlled timers
        timers = new PostmanTimers(null, function (err) {
            if (err) { // propagate the error out of sandbox
                dispatchEvent(bridge, execution, errorEventName, options.cursor, err);
                dispatchEvent(bridge, execution, EXECUTION_ERROR_EVENT, options.cursor, err);
            }
        }, function () {
            execution.return.async = true;
        }, function (err, dnd) {
            // clear timeout tracking timer
            waiting && (waiting = timers.wrapped.clearTimeout(waiting));

            // do not allow any more timers
            if (timers) {
                timers.seal();
                timers.clearAll();
            }

            // remove listener of disconnection event
            bridge.off(abortEventName);
            bridge.off(responseEventName);
            bridge.off(cookiesEventName);

            if (err) { // fire extra execution error event
                dispatchEvent(bridge, execution, errorEventName, options.cursor, err);
                dispatchEvent(bridge, execution, EXECUTION_ERROR_EVENT, options.cursor, err);
            }

            // @note delete response from the execution object to avoid dispatching
            // the large response payload back due to performance reasons.
            execution.response && (delete execution.response);

            // fire the execution completion event

            // note: We are sending shouldSkipExecution: false to dispatchEvent function
            // because this event should be fired even if shouldSkipExecution is true as this event is
            // used to complete the execution in the sandbox. All other events are fired only if
            // shouldSkipExecution is false.
            (dnd !== true) && dispatchEvent(bridge, { shouldSkipExecution: false },
                executionEventName, err || null, execution);
        });

        // if a timeout is set, we must ensure that all pending timers are cleared and an execution timeout event is
        // triggered.
        _.isFinite(options.timeout) && (waiting = timers.wrapped.setTimeout(function () {
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
            (new PostmanConsole(bridge, options.cursor, options.debug && glob.console, execution)),
            timers,
            (
                new PostmanAPI(execution, function (request, callback) {
                    var eventId = timers.setEvent(callback);

                    dispatchEvent(bridge, execution, executionRequestEventName, options.cursor, id, eventId, request);
                }, /* onStopExecution = */ function () {
                    execution.shouldSkipExecution = true;
                    timers.terminate(null);
                },
                dispatchAssertions, new PostmanCookieStore(id, bridge, timers, execution), {
                    disabledAPIs: initializationOptions.disabledAPIs
                })
            ),
            dispatchAssertions,
            { disableLegacyAPIs: initializationOptions.disableLegacyAPIs });
    });
};
