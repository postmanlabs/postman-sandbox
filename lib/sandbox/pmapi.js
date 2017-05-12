var FUNCTION = 'function',
    EXECUTION_ASSERTION_EVENT = 'execution.assertion',
    EXECUTION_ASSERTION_EVENT_BASE = 'execution.assertion.',

    VariableScope = require('postman-collection').VariableScope,
    chai = require('chai'),
    chaiPostman = require('./chai-postman'),

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

        return obj; // chainable
    },

    Postman;

Postman = function Postman (bridge, execution) {
    var assertionIndex = 0,
        assertionEventName = EXECUTION_ASSERTION_EVENT_BASE + execution.id,
        iterationData;

    // @todo - ensure runtime passes data in a scope format
    iterationData = new VariableScope();
    iterationData.syncVariablesFrom(execution.data);

    _assignDefinedReadonly(this, /** @lends Postman.prototype */ {
        /**
         * Contains information pertaining to the script execution
         *
         * @type {Object}
         */
        info: _assignDefinedReadonly({}, {
            eventName: execution.target,
            iteration: execution.cursor.iteration,
            iterationCount: execution.cursor.cycles,
            requestName: execution.legacy._itemName,
            requestId: execution.legacy._itemId
        }),

        /**
         * @type {VariableScope}
         */
        globals: execution.globals,

        /**
         * @type {VariableScope}
         */
        environment: execution.environment,

        /**
         * @type {VariableScope}
         */
        variables: new VariableScope(null, [iterationData.values, execution.environment.values, execution.globals.values]),

        /**
         * @type {VariableScope}
         */
        iterationData: iterationData,

        /**
         * @type {Request}
         */
        request: execution.request,

        /**
         * @type {Response}
         */
        response: execution.response,

        /**
         * @type {CookieList}
         */
        cookies: execution.cookies,

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
                index: assertionIndex++ // increment the assertion counter (do it before asserting)
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

    // add skipping ability to test
    this.test.skip = function (name) {
        var eventArgs = {
            name: name,
            skipped: true,
            passed: true,
            error: null,
            index: ++assertionIndex // increment the assertion counter (do it before asserting)
        };

        // trigger the assertion events with skips
        bridge.dispatch(assertionEventName, execution.cursor, eventArgs);
        bridge.dispatch(EXECUTION_ASSERTION_EVENT, execution.cursor, eventArgs);
    };

    // add response assertions
    if (this.response) {
        this.response.to = chai.expect(this.response).to;
    }
    // add request assertions
    if (this.request) {
        this.request.to = chai.expect(this.request).to;
    }
};

// expose chai assertion library via prototype
Postman.prototype.expect = chai.expect;

// make chai use postman extension
chai.use(chaiPostman);

// export
module.exports = Postman;
