/* eslint-disable max-classes-per-file */
const _ = require('lodash'),

    scopeLibraries = {
        JSON: require('liquid-json'),
        _: require('lodash3').noConflict(),
        CryptoJS: require('crypto-js'),
        atob: require('atob'),
        btoa: require('btoa'),
        tv4: require('tv4'),
        xml2Json: require('./xml2Json'),
        Backbone: require('backbone'),
        cheerio: require('cheerio')
    },

    LEGACY_GLOBS = [
        'tests', 'globals', 'environment', 'data', 'request', 'responseCookies', 'responseHeaders', 'responseTime',
        'responseCode', 'responseBody', 'iteration', 'postman',
        // scope libraries
        '_', 'CryptoJS', 'atob', 'btoa', 'tv4', 'xml2Json', 'Backbone', 'cheerio'
        // 'JSON', // removing JSON from the list since it is a standard JS object
    ],

    LEGACY_GLOBS_ALTERNATIVES = {
        tests: 'pm.test()',
        globals: 'pm.globals',
        environment: 'pm.environment',
        data: 'pm.iterationData',
        request: 'pm.request',
        responseCookies: 'pm.cookies',
        responseHeaders: 'pm.response.headers',
        responseTime: 'pm.response.responseTime',
        responseCode: 'pm.response.code',
        responseBody: 'pm.response.text()',
        iteration: 'pm.info.iteration',
        _: 'require(\'lodash\')',
        CryptoJS: 'require(\'crypto-js\')',
        atob: 'require(\'atob\')',
        btoa: 'require(\'btoa\')',
        tv4: 'require(\'ajv\')',
        xml2Json: 'require(\'xml2js\')',
        Backbone: 'require(\'backbone\')',
        cheerio: 'require(\'cheerio\')',
        'postman.setNextRequest': 'pm.execution.setNextRequest()',
        'postman.setEnvironmentVariable': 'pm.environment.set()',
        'postman.getEnvironmentVariable': 'pm.environment.get()',
        'postman.clearEnvironmentVariables': 'pm.environment.clear()',
        'postman.clearEnvironmentVariable': 'pm.environment.unset()',
        'postman.setGlobalVariable': 'pm.globals.set()',
        'postman.getGlobalVariable': 'pm.globals.get()',
        'postman.clearGlobalVariables': 'pm.globals.clear()',
        'postman.clearGlobalVariable': 'pm.globals.unset()',
        'postman.getResponseCookie': 'pm.cookies.get()',
        'postman.getResponseHeader': 'pm.response.headers.get()'
    },

    E = '',
    FUNCTION = 'function',
    TARGET_TEST = 'test',

    LEGACY_ASSERTION_ERROR_MESSAGE_PREFIX = 'expected ',
    LEGACY_ASSERTION_ERROR_MESSAGE_SUFFIX = ' to be truthy',

    /**
     * Different modes for a request body.
     *
     * @enum {String}
     */
    REQUEST_MODES = {
        RAW: 'raw',
        URLENCODED: 'urlencoded',
        FORMDATA: 'formdata',
        FILE: 'file'
    };

function getRequestBody (request) {
    var mode = _.get(request, 'body.mode'),
        body = _.get(request, 'body'),
        empty = body ? body.isEmpty() : true,
        content,
        computedBody;

    if (empty) {
        return;
    }

    content = body[mode];

    if (_.isFunction(content && content.all)) {
        content = content.all();
    }

    if (mode === REQUEST_MODES.RAW) {
        computedBody = {
            body: content
        };
    }
    else if (mode === REQUEST_MODES.URLENCODED) {
        computedBody = {
            form: _.reduce(content, function (accumulator, param) {
                if (param.disabled) { return accumulator; }

                // This is actually pretty simple,
                // If the variable already exists in the accumulator, we need to make the value an Array with
                // all the variable values inside it.
                if (accumulator[param.key]) {
                    _.isArray(accumulator[param.key]) ? accumulator[param.key].push(param.value) :
                        (accumulator[param.key] = [accumulator[param.key], param.value]);
                }
                else {
                    accumulator[param.key] = param.value;
                }

                return accumulator;
            }, {})
        };
    }
    else if (request.body.mode === REQUEST_MODES.FORMDATA) {
        computedBody = {
            formData: _.reduce(content, function (accumulator, param) {
                if (param.disabled) { return accumulator; }

                // This is actually pretty simple,
                // If the variable already exists in the accumulator, we need to make the value an Array with
                // all the variable values inside it.
                if (accumulator[param.key]) {
                    _.isArray(accumulator[param.key]) ? accumulator[param.key].push(param.value) :
                        (accumulator[param.key] = [accumulator[param.key], param.value]);
                }
                else {
                    accumulator[param.key] = param.value;
                }

                return accumulator;
            }, {})
        };
    }
    else if (request.body.mode === REQUEST_MODES.FILE) {
        computedBody = {
            body: _.get(request, 'body.file.content')
        };
    }

    return computedBody;
}

/**
 * Raises a single assertion event with an array of assertions from legacy `tests` object.
 *
 * @param  {Uniscope} scope -
 * @param  {Object} pmapi -
 * @param  {Function} onAssertion -
 */
function raiseAssertionEvent (scope, pmapi, onAssertion) {
    var tests = scope._imports && scope._imports.tests,
        assertionIndex = pmapi.test.index(),
        assertions;

    if (_.isEmpty(tests)) {
        return;
    }

    assertions = _.map(tests, function (value, key) {
        var assertionName = String(key),
            passed = Boolean(value),
            assertionError = null;

        // fake an assertion error for legacy tests
        if (!passed) {
            assertionError = new Error(LEGACY_ASSERTION_ERROR_MESSAGE_PREFIX +
                    String(value) + LEGACY_ASSERTION_ERROR_MESSAGE_SUFFIX);
            assertionError.name = 'AssertionError';
        }

        // @todo Move getAssertionObject function from pmapi-setup-runner.js to a common place and reuse it here too
        return {
            name: assertionName,
            skipped: false,
            passed: passed,
            error: assertionError,
            index: assertionIndex++
        };
    });

    onAssertion(assertions);
}

function logDeprecationWarning (key, legacyUsageSet, console) {
    // we've already logged warning once. ignore all next usages
    if (legacyUsageSet.has(key)) {
        return;
    }

    legacyUsageSet.add(key);

    if (LEGACY_GLOBS_ALTERNATIVES[key]) {
        console.warn(`Using "${key}" is deprecated. Use "${LEGACY_GLOBS_ALTERNATIVES[key]}" instead.`);
    }
    else if (LEGACY_GLOBS.includes(key)) {
        console.warn(`Using "${key}" is deprecated.`);
    }
}

class PostmanLegacyInterface {
    /**
     * @param {Object} execution -
     * @param {Object} globalvars -
     */
    constructor (execution, globalvars) {
        this.__execution = execution;
        this.__environment = globalvars.environment;
        this.__globals = globalvars.globals;
    }

    setEnvironmentVariable (key, value) {
        if ((value === false || value) && typeof (value && value.toString) === FUNCTION) {
            value = value.toString();
        }
        this.__environment[key] = value;

        return this.__execution.environment.set(key, value);
    }

    getEnvironmentVariable (key) {
        return this.__execution.environment.get(key);
    }

    clearEnvironmentVariables () {
        for (var prop in this.__environment) {
            if (Object.hasOwn(this.__environment, prop)) {
                delete this.__environment[prop];
            }
        }

        return this.__execution.environment.clear();
    }

    clearEnvironmentVariable (key) {
        key && (delete this.__environment[key]);

        return this.__execution.environment.unset(key);
    }

    setGlobalVariable (key, value) {
        if ((value === false || value) && typeof (value && value.toString) === FUNCTION) {
            value = value.toString();
        }
        this.__globals[key] = value;

        return this.__execution.globals.set(key, value);
    }

    getGlobalVariable (key) {
        return this.__execution.globals.get(key);
    }

    clearGlobalVariables () {
        for (var prop in this.__globals) {
            if (Object.hasOwn(this.__globals, prop)) {
                delete this.__globals[prop];
            }
        }

        return this.__execution.globals.clear();
    }

    clearGlobalVariable (key) {
        key && (delete this.__globals[key]);

        return this.__execution.globals.unset(key);
    }

    setNextRequest (what) {
        this.__execution.return && (this.__execution.return.nextRequest = what);
    }
}

/**
 * @constructor
 * @extends {PostmanLegacyInterface}
 */
class PostmanLegacyTestInterface extends PostmanLegacyInterface {
    /**
     * @param {String} cookieName -
     * @returns {Object}
     */
    getResponseCookie (cookieName) {
        return this.__execution.cookies ? this.__execution.cookies.one(String(cookieName)) : undefined;
    }

    /**
     * @param {String} headerName -
     * @returns {String}
     */
    getResponseHeader (headerName) {
        var header = (this.__execution.response && this.__execution.response.headers) &&
            this.__execution.response.headers.one(headerName);

        return header ? header.value : undefined;
    }
}

module.exports = {
    /**
     *
     * @param  {Uniscope} scope -
     * @param  {Execution} execution -
     * @param  {Object} console -
     *
     * @note ensure that globalvars variables added here are added as part of the LEGACY_GLOBS array
     */
    setup (scope, execution, console) {
        /**
         * @name SandboxGlobals
         * @type {Object}
         */
        var globalvars = _.assign({}, scopeLibraries);

        // set global variables that are exposed in legacy interface
        // ---------------------------------------------------------

        // 1. set the tests object (irrespective of target)
        /**
         * Store your assertions in this object
         *
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.tests = {};

        // 2. set common environment, globals and data
        /**
         * All global variables at the initial stages when the script ran
         *
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.globals = execution.globals.syncVariablesTo();

        /**
         * All environment variables at the initial stages when script ran
         *
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.environment = execution.environment.syncVariablesTo();

        /**
         * The data object if it was passed during a collection run
         *
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.data = execution.data || (execution.data = {});

        // 3. set the request object in legacy structure
        /**
         * The request that will be sent (or has been sent)
         *
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.request = execution.request ? {
            id: execution.legacy ? execution.legacy._itemId : undefined,
            name: execution.legacy ? execution.legacy._itemName : undefined,
            description: execution.request.description ?
                execution.request.description.toString() : undefined,
            headers: execution.request.headers.toObject(true, false, true, true),
            method: execution.request.method,
            url: execution.request.url.toString(),
            data: (function (request) {
                var body = getRequestBody(request);

                return body ? (body.form || body.formData || body.body || {}) : {};
            }(execution.request))
        } : {};

        // 4. set the response related objects
        if (execution.target === TARGET_TEST) {
            /**
             * Stores the response cookies
             *
             * @memberOf SandboxGlobals
             * @type {Array.<Object>}
             */
            globalvars.responseCookies = execution.cookies || [];

            /**
             * Stores the response headers with the keys being case sensitive
             *
             * @memberOf SandboxGlobals
             * @type {Array.<Object>}
             */
            globalvars.responseHeaders = {};
            execution.response && execution.response.headers.each(function (header) {
                header && !header.disabled && (globalvars.responseHeaders[header.key] = header.value);
            });

            /**
             * @memberOf SandboxGlobals
             * @type {Number}
             */
            globalvars.responseTime = execution.response ? execution.response.responseTime : NaN;

            /**
             * @memberOf SandboxGlobals
             * @type {Number}
             */
            globalvars.responseCode = execution.response ? _.clone(execution.response.details()) : {
                code: NaN,
                name: E,
                details: E
            };

            /**
             * @memberOf SandboxGlobals
             * @type {String}
             */
            globalvars.responseBody = execution.response ? execution.response.text() : undefined;
        }

        // 5. add the iteration information
        globalvars.iteration = _.isObject(execution.cursor) ? execution.cursor.iteration : 0;

        // 6. create the postman interface object
        const postmanLegacy = new (execution.target === TARGET_TEST ?
                PostmanLegacyTestInterface : PostmanLegacyInterface)(execution, globalvars),

            legacyAPIUsage = new Set();

        scope.__is_deprecation_warning_enabled = true;

        /**
         * @memberOf SandboxGlobals
         * @type {PostmanLegacyInterface}
         */
        globalvars.postman = new Proxy(postmanLegacy, {
            get (target, prop) {
                scope.__is_deprecation_warning_enabled &&
                    logDeprecationWarning(`postman.${prop}`, legacyAPIUsage, console);

                return target[prop];
            }
        });

        // wrap all globals to ensure we track their usage to show warnings
        // on access.
        LEGACY_GLOBS.forEach((key) => {
            if (!(globalvars[key] && ['object', 'function'].includes(typeof globalvars[key]))) {
                return;
            }

            globalvars[key] = new Proxy(globalvars[key], {
                set (target, prop, value) {
                    scope.__is_deprecation_warning_enabled && logDeprecationWarning(key, legacyAPIUsage, console);

                    target[prop] = value;
                },

                get (target, prop) {
                    // special handling for postman.* because we're handling
                    // those in the `PostmanLegacyInterface` itself.
                    if (key !== 'postman') {
                        scope.__is_deprecation_warning_enabled && logDeprecationWarning(key, legacyAPIUsage, console);
                    }

                    return target[prop];
                },

                apply (target, thisArg, args) {
                    scope.__is_deprecation_warning_enabled && logDeprecationWarning(key, legacyAPIUsage, console);

                    return target.apply(thisArg, args);
                }
            });
        });

        // make a final pass to ensure that the global variables are present


        // all the globals are now added to scope
        scope.import(globalvars);
        globalvars = null; // dereference

        // add a flag to ensure that when teardown is called, it does not tear down a scope that was never setup
        scope.__postman_legacy_setup = true;
    },

    teardown (scope) {
        if (!scope.__postman_legacy_setup) {
            return;
        }

        for (var i = 0, ii = LEGACY_GLOBS.length; i < ii; i++) {
            scope.unset(LEGACY_GLOBS[i]);
        }

        scope.__postman_legacy_setup = false;
    },

    /**
     * This is the place where we should put all the tasks
     * that need to be executed after the completion of script execution
     *
     * @param  {Uniscope} scope -
     * @param  {Object} pmapi -
     * @param  {Function} onAssertion -
     */
    finish (scope, pmapi, onAssertion) {
        if (!scope.__postman_legacy_setup) {
            return;
        }

        scope.__is_deprecation_warning_enabled = false;

        raiseAssertionEvent(scope, pmapi, onAssertion);
    },

    LEGACY_GLOBS
};
