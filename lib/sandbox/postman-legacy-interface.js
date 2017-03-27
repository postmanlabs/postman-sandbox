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

    PostmanLegacyInterface,
    PostmanLegacyTestInterface;

/**
 * @constructor
 * @param {Object} options
 */
PostmanLegacyInterface = function (options) {
    _.assign(this, {
        result: _.get(options, 'result', {}),
        info: _.get(options, 'masked', {}),
        environment: _.get(options, 'globals.environment', {}),
        globals: _.get(options, 'globals.globals', {})
    });
};

_.assign(PostmanLegacyInterface.prototype, /** PostmanLegacyInterface.prototype */ {
    setEnvironmentVariable: function (key, value) {
        if ((value === false || value) && typeof (value && value.toString) === 'function') {
            value = value.toString();
        }
        this.environment[key] = value;
    },

    getEnvironmentVariable: function (key) {
        return this.environment[key];
    },

    clearEnvironmentVariables: function () {
        for (var key in this.environment) {
            if (this.environment.hasOwnProperty(key)) {
                delete this.environment[key];
            }
        }
    },

    clearEnvironmentVariable: function (key) {
        this.environment.hasOwnProperty(key) && (delete this.environment[key]);
    },

    setGlobalVariable: function (key, value) {
        if ((value === false || value) && typeof (value && value.toString) === 'function') {
            value = value.toString();
        }
        this.globals[key] = value;
    },

    getGlobalVariable: function (key) {
        return this.globals[key];
    },

    clearGlobalVariables: function () {
        for (var key in this.globals) {
            if (this.globals.hasOwnProperty(key)) {
                delete this.globals[key];
            }
        }
    },

    clearGlobalVariable: function (key) {
        this.globals.hasOwnProperty(key) && (delete this.globals[key]);
    },

    setNextRequest: function (what) {
        this.result.nextRequest = what;
    }
});

/**
 * @constructor
 * @extends {PostmanLegacyInterface}
 * @param {Object} options
 */
PostmanLegacyTestInterface = function (options) {
    PostmanLegacyInterface.apply(this, arguments);

    this.responseHeaders = _.mapKeys(_.get(options, 'globals.responseHeaders', {}), function (val, key) {
        return key.toLowerCase();
    });

    this.responseCookies = {};
    _.each(_.get(options, 'globals.responseCookies', []), function (cookie) {
        _.isString(cookie && cookie.name) && (this.responseCookies[cookie.name.toLowerCase()] = cookie);
    }.bind(this));
};
inherits(PostmanLegacyTestInterface, PostmanLegacyInterface);

_.assign(PostmanLegacyTestInterface.prototype, /** PostmanLegacyTestInterface.prototype */ {
    /**
     * @param {String} cookieName
     * @returns {Object}
     */
    getResponseCookie: function (cookieName) {
        return _.isString(cookieName) ? this.responseCookies[cookieName.toLowerCase()] : undefined;
    },

    /**
     * @param {String} headerName
     * @returns {String}
     */
    getResponseHeader: function (headerName) {
        return _.isString(headerName) ? this.responseHeaders[headerName.toLowerCase()] : undefined;
    }
});

module.exports = {
    create: function (options) {
        if (_.get(options, 'masked.scriptType') === 'test') {
            return new PostmanLegacyTestInterface(options);
        }

        return new PostmanLegacyInterface(options);
    },

    setup: function (scope, execution, options) {
        scope.import(scopeLibraries);
        // @todo import request, response, env, globals, data, iteration, etc
        // responseCookies: legacyResponse.responseCookies,
        // responseBody: legacyResponse.responseBody,
        // responseCode: legacyResponse.responseCode,
        // responseHeaders: legacyResponse.responseHeaders,
        // responseTime: legacyResponse.responseTime
        scope.import({
            iteration: _.isObject(options.cursor) ? options.cursor.iteration : 1,
            postman: this.create({
                result: execution.result,
                masked: {
                    scriptType: execution.target
                },
                globals: { // @todo add responseHeaders / cookies and test script specific stuff
                    environment: execution.environment.syncVariablesTo(),
                    globals: execution.globals.syncVariablesTo()
                }
            })
        });
    }
};
