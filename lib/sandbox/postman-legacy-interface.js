var _ = require('lodash'),
    inherits = require('inherits'),

    PostmanLegacyInterface,
    PostmanLegacyTestInterface;

/**
 * @constructor
 * @param {Object} options
 */
PostmanLegacyInterface = function (options) {
    _.assign(this, {
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
        this.info.nextRequest = what;
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
    }
};
