var _ = require('lodash'),
    inherits = require('inherits'),

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
        'JSON', '_', 'CryptoJS', 'atob', 'btoa', 'tv4', 'xml2Json', 'Backbone', 'cheerio'
    ],

    E = '',
    FUNCTION = 'function',
    TARGET_TEST = 'test',

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
    },

    getRequestBody, // fn
    PostmanLegacyInterface,
    PostmanLegacyTestInterface;

getRequestBody = function (request) {
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
};

/**
 * @constructor
 * @param {Object} options
 */
PostmanLegacyInterface = function (execution, globalvars) {
    this.__execution = execution;
    this.__environment = globalvars.environment;
    this.__globals = globalvars.globals;
};

_.assign(PostmanLegacyInterface.prototype, /** PostmanLegacyInterface.prototype */ {
    setEnvironmentVariable: function (key, value) {
        if ((value === false || value) && typeof (value && value.toString) === FUNCTION) {
            value = value.toString();
        }
        this.__environment[key] = value;
        return this.__execution.environment.set(key, value);
    },

    getEnvironmentVariable: function (key) {
        return this.__execution.environment.get(key);
    },

    clearEnvironmentVariables: function () {
        for (var prop in this.__environment) {
            if (this.__environment.hasOwnProperty(prop)) {
                delete this.__environment[prop];
            }
        }
        return this.__execution.environment.clear();
    },

    clearEnvironmentVariable: function (key) {
        key && (delete this.__environment[key]);
        return this.__execution.environment.unset(key);
    },

    setGlobalVariable: function (key, value) {
        if ((value === false || value) && typeof (value && value.toString) === FUNCTION) {
            value = value.toString();
        }
        this.__globals[key] = value;
        return this.__execution.globals.set(key, value);
    },

    getGlobalVariable: function (key) {
        return this.__execution.globals.get(key);
    },

    clearGlobalVariables: function () {
        for (var prop in this.__globals) {
            if (this.__globals.hasOwnProperty(prop)) {
                delete this.__globals[prop];
            }
        }
        return this.__execution.globals.clear();
    },

    clearGlobalVariable: function (key) {
        key && (delete this.__globals[key]);
        return this.__execution.globals.unset(key);
    },

    setNextRequest: function (what) {
        this.__execution.return && (this.__execution.return.nextRequest = what);
    }
});

/**
 * @constructor
 * @extends {PostmanLegacyInterface}
 * @param {Object} options
 */
PostmanLegacyTestInterface = function () {
    PostmanLegacyInterface.apply(this, arguments); // call super
};

inherits(PostmanLegacyTestInterface, PostmanLegacyInterface);

_.assign(PostmanLegacyTestInterface.prototype, /** PostmanLegacyTestInterface.prototype */ {
    /**
     * @param {String} cookieName
     * @returns {Object}
     */
    getResponseCookie: function (cookieName) {
        return this.__execution.cookies ? this.__execution.cookies.one(String(cookieName)) : undefined;
    },

    /**
     * @param {String} headerName
     * @returns {String}
     */
    getResponseHeader: function (headerName) {
        var header = (this.__execution.response && this.__execution.response.headers) &&
            this.__execution.response.headers.one(headerName);

        return header ? header.value : undefined;
    }
});

module.exports = {
    /**
     *
     * @param  {Uniscope} scope
     * @param  {Execution} execution
     * @param  {Object} options
     *
     * @note ensure that globalvars variables added here are added as part of the LEGACY_GLOBS array
     */
    setup: function (scope, execution, options) {

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
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.tests = _.isObject(execution.tests) ? execution.tests : (execution.tests = {});

        // 2. set common environment, globals and data
        /**
         * All global variables at the initial stages when the script ran
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.globals = execution.globals.syncVariablesTo();

        /**
         * All environment variables at the initial stages when script ran
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.environment = execution.environment.syncVariablesTo();

        /**
         * The data object if it was passed during a collection run
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.data = execution.data || (execution.data = {});

        // 3. set the request object in legacy structure
        /**
         * The request that will be sent (or has been sent)
         * @memberOf SandboxGlobals
         * @type {Object}
         */
        globalvars.request = execution.request ? {
            id: execution.legacy ? execution.legacy._itemId : undefined,
            name: execution.legacy ? execution.legacy._itemName : undefined,
            description: execution.request.description ?
                execution.request.description.toString() : undefined,
            headers: execution.request.getHeaders(),
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
             * @memberOf SandboxGlobals
             * @type {Array.<Object>}
             */
            globalvars.responseCookies = execution.cookies || [];

            /**
             * Stores the response headers with the keys being case sensitive
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
        globalvars.iteration = _.isObject(options.cursor) ? options.cursor.iteration : 0;

        // 6. create the postman interface object
        /**
         * @memberOf SandboxGlobals
         * @type {PostmanLegacyInterface}
         */
        globalvars.postman = new (execution.target === TARGET_TEST ?
            PostmanLegacyTestInterface : PostmanLegacyInterface)(execution, globalvars);

        // make a final pass to ensure that the global variables are present


        // all the globals are now added to scope
        scope.import(globalvars);
        globalvars = null; // dereference

        // add a flag to ensure that when teardown is called, it does not tear down a scope that was never setup
        scope.__postman_legacy_setup = true;
    },

    teardown: function (scope) {
        if (!scope.__postman_legacy_setup) {
            return;
        }

        for (var i = 0, ii = LEGACY_GLOBS.length; i < ii; i++) {
            scope.unset(LEGACY_GLOBS[i]);
        }

        scope.__postman_legacy_setup = false;
    }
};
