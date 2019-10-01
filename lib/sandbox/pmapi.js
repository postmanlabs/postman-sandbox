var EXECUTION_ASSERTION_EVENT = 'execution.assertion',
    EXECUTION_ASSERTION_EVENT_BASE = 'execution.assertion.',

    _ = require('lodash'),
    Ajv = require('ajv'),
    sdk = require('postman-collection'),
    PostmanCookieJar = require('./cookie-jar'),
    VariableScope = sdk.VariableScope,
    PostmanRequest = sdk.Request,
    PostmanResponse = sdk.Response,
    PostmanCookieList = sdk.CookieList,
    chai = require('chai'),

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
 * @param {Function} onRequest
 * @param {Object} cookieStore
 */
Postman = function Postman (bridge, execution, onRequest, cookieStore) {
    var assertionEventName = EXECUTION_ASSERTION_EVENT_BASE + execution.id, // we keep this prepared for repeat use
        iterationData;

    // @todo - ensure runtime passes data in a scope format
    iterationData = new VariableScope();
    iterationData.syncVariablesFrom(execution.data);

    // instead of creating new instance of variableScope,
    // reuse one so that any changes made through pm.variables.set() is directly reflected
    execution._variables.addLayer(iterationData.values);
    execution._variables.addLayer(execution.environment.values);
    execution._variables.addLayer(execution.collectionVariables.values);
    execution._variables.addLayer(execution.globals.values);

    execution.cookies && (execution.cookies.jar = function () {
        return new PostmanCookieJar(cookieStore);
    });

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
        collectionVariables: execution.collectionVariables,

        /**
         * @type {VariableScope}
         */
        variables: execution._variables,

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
         * @type {Object}
         */
        visualizer: {
            /**
             * Set visualizer template and its options
             *
             * @param {String} template - visualisation layout in form of template
             * @param {Object} [data] - data object to be used in template
             * @param {Object} [options] - options to use while processing the template
             */
            set: function (template, data, options) {
                if (typeof template !== 'string') {
                    throw new Error(`Invalid template. Template must be of type string, found ${typeof template}`);
                }

                if (data && typeof data !== 'object') {
                    throw new Error(`Invalid data. Data must be an object, found ${typeof data}`);
                }

                if (options && typeof options !== 'object') {
                    throw new Error(`Invalid options. Options must be an object, found ${typeof options}`);
                }

                /**
                 * @typedef {Object} Visualizer
                 *
                 * @property {String} template - template string
                 * @property {Object} data - data to use while processing template
                 * @property {Object} options - options to use while processing template
                 */
                execution.return.visualizer = {
                    template: template,
                    data: data,
                    options: options
                };
            },

            /**
             * Clear all visualizer data
             */
            clear: function () {
                execution.return.visualizer = undefined;
            }
        }
    });

    // extend pm api with test runner abilities
    setupTestRunner(this, function (assertion) {
        bridge.dispatch(assertionEventName, execution.cursor, [assertion]);
        bridge.dispatch(EXECUTION_ASSERTION_EVENT, execution.cursor, [assertion]);
    });

    // add response assertions
    if (this.response) {
        // these are removed before serializing see `purse.js`
        Object.defineProperty(this.response, 'to', {
            get: function () {
                return chai.expect(this).to;
            }
        });
    }
    // add request assertions
    if (this.request) {
        // these are removed before serializing see `purse.js`
        Object.defineProperty(this.request, 'to', {
            get: function () {
                return chai.expect(this).to;
            }
        });
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

        onRequest(PostmanRequest.isRequest(req) ? req : (new PostmanRequest(req)), function (err, resp, history) {
            if (history && !PostmanCookieList.isCookieList(history.cookies)) {
                history.cookies = new PostmanCookieList({}, history.cookies);
            }

            _.isFunction(callback) && callback.call(self, err,
                PostmanResponse.isResponse(resp) ? resp : (new PostmanResponse(resp)),
                history);
        });

        return self;
    };

    iterationData = null; // precautionary
};

// expose chai assertion library via prototype
Postman.prototype.expect = chai.expect;

// make chai use postman extension
chai.use(require('chai-postman')(sdk, _, Ajv));

// export
module.exports = Postman;
