var FUNCTION = 'function',
    EXECUTION_ASSERTION_EVENT = 'execution.assertion',
    EXECUTION_ASSERTION_EVENT_BASE = 'execution.assertion.',

    /**
     * Use this function to assign readonly properties to an object
     * @param {Object} obj
     * @param {Object} properties
     */
    _assignDefinedReadonly = function (obj, properties) {
        var config = {
                writable: false
            },

            prop;

        for (prop in properties) {
            if (properties.hasOwnProperty(prop) && (properties[prop] !== undefined)) {
                config.value = properties[prop];
                Object.defineProperty(obj, prop, config);
            }
        }
    },

    Postman;

Postman = function Postman (bridge, execution) {
    var assertionIndex = 0,
        assertionEventName = EXECUTION_ASSERTION_EVENT_BASE + execution.id;

    _assignDefinedReadonly(this, /** @lends Postman.prototype */ {
        /**
         * @type {VariableScope}
         */
        globals: execution.globals,

        /**
         * @type {VariableScope}
         */
        environment: execution.environment,

        /**
         * @type {Request}
         */
        request: execution.request,

        /**
         * @type {Response}
         */
        response: execution.response,

        /**
         * @param  {String} name
         * @param  {Function} assert
         * @chainable
         */
        test: function (name, assert) {

            if (typeof assert !== FUNCTION) {
                return;
            }

            var eventArgs = {
                name: name,
                passed: true,
                error: null,
                index: ++assertionIndex // increment the assertion counter (do it before asserting)
            };

            try { assert(); }
            catch (e) {
                eventArgs.error = e;
                eventArgs.passed = false;
            }

            // trigger the assertion events
            bridge.dispatch(assertionEventName, execution.cursor, eventArgs);
            bridge.dispatch(EXECUTION_ASSERTION_EVENT, execution.cursor, eventArgs);

            return this; // make it chainable
        }
    });
};

// expose chai assertion library via prototype
Postman.prototype.expect = require('chai').expect;

// export
module.exports = Postman;
