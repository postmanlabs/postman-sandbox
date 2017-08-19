var EXECUTION_ASSERTION_EVENT = 'execution.assertion',
    EXECUTION_ASSERTION_EVENT_BASE = 'execution.assertion.',

    _ = require('lodash'),
    VariableScope = require('postman-collection').VariableScope,
    PostmanRequest = require('postman-collection').Request,
    PostmanResponse = require('postman-collection').Response,
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

    setupTestRunner = require('./pmapi-setup-runner'),
    Postman;

/**
 * @constructor
 *
 * @param {EventEmitter} bridge
 * @param {Execution} execution
 */
Postman = function Postman (bridge, execution, onRequest) {
    var assertionEventName = EXECUTION_ASSERTION_EVENT_BASE + execution.id, // we keep this prepared for repeat use
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
        // eslint-disable-next-line max-len
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
        cookies: execution.cookies
    });

    // extend pm api with test runner abilities
    setupTestRunner(this, function (assertion) {
        bridge.dispatch(assertionEventName, execution.cursor, assertion);
        bridge.dispatch(EXECUTION_ASSERTION_EVENT, execution.cursor, assertion);
    });

    // add response assertions
    if (this.response) {
        this.response.to = chai.expect(this.response).to;
    }
    // add request assertions
    if (this.request) {
        this.request.to = chai.expect(this.request).to;
    }

    /**
     * Allows one to send request from script.
     *
     * @param {Request|String} req
     * @param {Function} callback
     */
    this.sendRequest = function (req, callback) {
        var self = this;
        if (!req) {
            return _.isFunction(callback) && callback.call(self, new Error('sendrequest: nothing to request'));
        }

        onRequest(PostmanRequest.isRequest(req) ? req : (new PostmanRequest(req)), function (err, resp) {
            _.isFunction(callback) && callback.call(self, err,
                PostmanResponse.isResponse(resp) ? resp : (new PostmanResponse(resp)));
        });

        return self;
    };

    iterationData = null; // precautionary
};

// expose chai assertion library via prototype
Postman.prototype.expect = chai.expect;

// make chai use postman extension
chai.use(chaiPostman);

// export
module.exports = Postman;
