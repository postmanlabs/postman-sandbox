var _ = require('lodash'),
    inherits = require('inherits'),

    scopeLibraries = {
        JSON: require('liquid-json'),
        Buffer: require('buffer').Buffer,
        _: require('lodash3').noConflict(),
        CryptoJS: require('crypto-js'),
        atob: require('atob'),
        btoa: require('btoa'),
        tv4: require('tv4'),
        xml2Json: require('./xml2Json'),
        Backbone: require('backbone'),
        cheerio: require('cheerio')
    },

    TARGET_TEST = 'test',

    PostmanLegacyInterface,
    PostmanLegacyTestInterface;

/**
 * @constructor
 * @param {Object} options
 */
PostmanLegacyInterface = function (execution) {
    this.__execution = execution;
};

_.assign(PostmanLegacyInterface.prototype, /** PostmanLegacyInterface.prototype */ {
    setEnvironmentVariable: function (key, value) {
        return this.__execution.environment.set(key, value);
    },

    getEnvironmentVariable: function (key) {
        return this.__execution.environment.get(key);
    },

    clearEnvironmentVariables: function () {
        return this.__execution.environment.clear();
    },

    clearEnvironmentVariable: function (key) {
        return this.__execution.environment.unset(key);
    },

    setGlobalVariable: function (key, value) {
        return this.__execution.globals.set(key, value);
    },

    getGlobalVariable: function (key) {
        return this.__execution.globals.get(key);
    },

    clearGlobalVariables: function () {
        return this.__execution.globals.clear();
    },

    clearGlobalVariable: function (key) {
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
PostmanLegacyTestInterface = function (execution) {
    PostmanLegacyInterface.apply(this, arguments);

    this.__cookies = {};
    _.each(execution.cookies, function (cookie) {
        _.isString(cookie && cookie.name) && (this.__cookies[cookie.name.toLowerCase()] = cookie);
    }.bind(this));
};
inherits(PostmanLegacyTestInterface, PostmanLegacyInterface);

_.assign(PostmanLegacyTestInterface.prototype, /** PostmanLegacyTestInterface.prototype */ {
    /**
     * @param {String} cookieName
     * @returns {Object}
     */
    getResponseCookie: function (cookieName) {
        return _.isString(cookieName) ? this.__cookies[cookieName.toLowerCase()] : undefined;
    },

    /**
     * @param {String} headerName
     * @returns {String}
     */
    getResponseHeader: function (headerName) {
        return (this.__execution.response && this.__execution.response.headers) ?
            this.__execution.response.headers.one(headerName) : undefined;
    }
});

module.exports = {
    setup: function (scope, execution, options) {

        /**
         * @name SandboxGlobals
         * @type {Object}
         */
        var globalvars = _.assign({}, scopeLibraries);

        // set global variables that are exposed in legacy interface
        // ---------------------------------------------------------

        // 1. set the tests object (irrespective of target)
        if (_.isObject(execution.tests)) {
            /**
             * Store your assertions in this object
             * @memberOf SandboxGlobals
             * @type {Object}
             */
            globalvars.tests = execution.tests;
        }

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
        globalvars.data = execution.data;

        // 3. set the request object in legacy structure
        if (execution.request) {
            /**
             * The request that will be sent (or has been sent)
             * @memberOf SandboxGlobals
             * @type {Object}
             */
            globalvars.request = {
                id: execution.legacy ? execution.legacy._itemId : undefined,
                name: execution.legacy ? execution.legacy._itemName : undefined,
                description: execution.request.description ?
                    execution.request.description.toString() : undefined,
                headers: execution.request.getHeaders(),
                method: execution.request.method,
                url: execution.request.url.toString(),
                data: (function (body) {
                    return (body && (body = body.toJSON()) && body.mode) ? body[body.mode] : undefined;
                }(execution.request.body))
            };
        }

        // 4. set the response related objects
        if (execution.response) {
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
            execution.response.headers.each(function (header) {
                header && !header.disabled && (globalvars.responseHeaders[header.key] = header.value);
            });

            /**
             * @memberOf SandboxGlobals
             * @type {Number}
             */
            execution.responseTime = execution.response.responseTime;

            /**
             * @memberOf SandboxGlobals
             * @type {Number}
             */
            execution.responseCode = _.clone(execution.response.details());

            /**
             * @memberOf SandboxGlobals
             * @type {String}
             */
            execution.responseBody = execution.response.text();
        }

        // 5. add the iteration information
        globalvars.iteration = _.isObject(options.cursor) ? options.cursor.iteration : 0;

        // 6. create the postman interface object
        /**
         * @memberOf SandboxGlobals
         * @type {PostmanLegacyInterface}
         */
        globalvars.postman = new (execution.target === TARGET_TEST ?
            PostmanLegacyTestInterface : PostmanLegacyInterface)(execution);

        // all the globals are now added to scope
        scope.import(globalvars);
        globalvars = null; // dereference
    }
};
