const _ = require('lodash'),
    sdk = require('postman-collection'),
    PostmanCookieJar = require('./cookie-jar'),
    VariableScope = sdk.VariableScope,
    PostmanRequest = sdk.Request,
    PostmanResponse = sdk.Response,
    PostmanCookieList = sdk.CookieList,
    chai = require('chai'),

    /**
     * Use this function to assign readonly properties to an object
     *
     * @private
     *
     * @param {Object} obj -
     * @param {Object} properties -
     * @param {Array.<String>} [disabledProperties=[]] -
     */
    _assignDefinedReadonly = function (obj, properties, disabledProperties = []) {
        var config = {
                writable: false
            },

            prop;

        for (prop in properties) {
            if (
                !_.includes(disabledProperties, prop) &&
                Object.hasOwnProperty.call(properties, prop) &&
                (properties[prop] !== undefined)
            ) {
                config.value = properties[prop];
                Object.defineProperty(obj, prop, config);
            }
        }

        return obj; // chainable
    },

    setupTestRunner = require('./pmapi-setup-runner');

/**
 * @constructor
 *
 * @param {Execution} execution - execution context
 * @param {Function} onRequest - callback to execute when pm.sendRequest() called
 * @param {Function} onSkipRequest - callback to execute when pm.execution.skipRequest() called
 * @param {Function} onAssertion - callback to execute when pm.expect() called
 * @param {Object} cookieStore - cookie store
 * @param {Function} requireFn - requireFn
 * @param {Object} [options] - options
 * @param {Array.<String>} [options.disabledAPIs] - list of disabled APIs
 */
function Postman (execution, onRequest, onSkipRequest, onAssertion, cookieStore, requireFn, options = {}) {
    // @todo - ensure runtime passes data in a scope format
    let iterationData = new VariableScope();

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
         * @interface Info
         */

        /**
         * The pm.info object contains information pertaining to the script being executed.
         * Useful information such as the request name, request Id, and iteration count are
         * stored inside of this object.
         *
         * @type {Info}
         */
        info: _assignDefinedReadonly({}, /** @lends Info */ {
            /**
             * Contains information whether the script being executed is a "prerequest" or a "test" script.
             *
             * @type {string}
             * @instance
             */
            eventName: execution.target,

            /**
             * Is the value of the current iteration being run.
             *
             * @type {number}
             * @instance
             */
            iteration: execution.cursor.iteration,

            /**
             * Is the total number of iterations that are scheduled to run.
             *
             * @type {number}
             * @instance
             */
            iterationCount: execution.cursor.cycles,

            /**
             * The saved name of the individual request being run.
             *
             * @type {string}
             * @instance
             */
            requestName: execution.legacy._itemName,

            /**
             * The unique guid that identifies the request being run.
             *
             * @type {string}
             * @instance
             */
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
         * The iterationData object contains data from the data file provided during a collection run.
         *
         * @type {VariableScope}
         */
        iterationData: iterationData,

        /**
         * The request object inside pm is a representation of the request for which this script is being run.
         * For a pre-request script, this is the request that is about to be sent and when in a test script,
         * this is the representation of the request that was sent.
         *
         * @type {Request}
         */
        request: execution.request,

        /**
         * Inside the test scripts, the pm.response object contains all information pertaining
         * to the response that was received.
         *
         * @type {Response}
         * @excludeFromPrerequestScript
         */
        response: execution.response,

        /**
         * The cookies object contains a list of cookies that are associated with the domain
         * to which the request was made.
         *
         * @type {CookieList}
         */
        cookies: execution.cookies,

        /**
         * @interface Visualizer
         */
        /**
         * @type {Visualizer}
         */
        visualizer: /** @lends Visualizer */ {
            /**
             * Set visualizer template and its options
             *
             * @instance
             * @param {String} template - visualisation layout in form of template
             * @param {Object} [data] - data object to be used in template
             * @param {Object} [options] - options to use while processing the template
             */
            set (template, data, options) {
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
                 *
                 * @property {String} template - template string
                 * @property {Object} data - data to use while processing template
                 * @property {Object} options - options to use while processing template
                 */
                execution.return.visualizer = {
                    template,
                    data,
                    options
                };
            },

            /**
             * Clear all visualizer data
             *
             * @instance
             */
            clear () {
                execution.return.visualizer = undefined;
            }
        },

        /**
         * Allows one to send request from script asynchronously.
         *
         * @param {Request|String} req - request object or request url
         * @param {Function} callback - callback function
         */
        sendRequest: function (req, callback) {
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
        },

        /**
         * @interface Execution
         */
        /**
         * Exposes handlers to control or access execution state
         *
         * @type {Execution}
         */
        execution: /** @lends Execution */ {
            /**
             * Stops the current request and its scripts from executing.
             *
             * @function
             * @excludeFromTestScript
             * @instance
             */
            skipRequest: onSkipRequest,

            /**
             * @interface ExecutionLocation
             * @extends Array<string>
             */

            /**
             * The path of the current request.
             *
             * @type {ExecutionLocation} - current execution path
             * @instance
             */
            location: _assignDefinedReadonly(execution.legacy._itemPath || [], /** @lends ExecutionLocation */ {
                /**
                 * The item name whose script is currently being executed.
                 *
                 * @instance
                 * @type {string}
                 */
                current: execution.legacy._eventItemName
            }),

            /**
             * Sets the next request to be run after the current request, when
             * running the collection. Passing `null` stops the collection run
             * after the current request is executed.
             *
             * @instance
             * @param {string|null} request - name of the request to run next
             */
            setNextRequest: function setNextRequest (request) {
                execution.return && (execution.return.nextRequest = request);
            }
        },

        /**
         * Imports a package in the script.
         *
         * @param {String} name - name of the module
         * @returns {any} - exports from the module
         */
        require: function (name) {
            return requireFn(name);
        }
    }, options.disabledAPIs);

    // extend pm api with test runner abilities
    setupTestRunner(this, onAssertion);

    // add response assertions
    if (this.response) {
        // these are removed before serializing see `purse.js`
        Object.defineProperty(this.response, 'to', {
            get () {
                return chai.expect(this).to;
            }
        });
    }
    // add request assertions
    if (this.request) {
        // these are removed before serializing see `purse.js`
        Object.defineProperty(this.request, 'to', {
            get () {
                return chai.expect(this).to;
            }
        });
    }

    iterationData = null; // precautionary
}

// expose chai assertion library via prototype
/**
 * @type {Chai.ExpectStatic}
 */
Postman.prototype.expect = chai.expect;

// export
module.exports = Postman;
