var _ = require('lodash'),
    sdk = require('postman-collection'),

    PROPERTY = {
        REQUEST: 'request',
        SCRIPT: 'script',
        DATA: 'data',
        COOKIES: 'cookies',
        RESPONSE: 'response'
    },

    TARGETS_WITH_REQUEST = {
        test: true,
        prerequest: true
    },

    TARGETS_WITH_RESPONSE = {
        test: true
    },

    CONTEXT_VARIABLE_SCOPES = ['_variables', 'environment', 'collectionVariables', 'globals'],

    trackingOptions = {autoCompact: true},

    Execution; // constructor

Execution = function (id, event, context, options) {
    this.id = id;
    this.target = event.listen || PROPERTY.SCRIPT;
    this.legacy = options.legacy || {};
    this.cursor = _.isObject(options.cursor) ? options.cursor : {};

    this.data = _.get(context, PROPERTY.DATA, {});
    this.cookies = new sdk.PropertyList(sdk.Cookie, null, context.cookies);

    _.forEach(CONTEXT_VARIABLE_SCOPES, function (variableScope) {
        // normalize variable scope instances
        this[variableScope] = sdk.VariableScope.isVariableScope(context[variableScope]) ?
            context[variableScope] : new sdk.VariableScope(context[variableScope]);

        // enable change tracking
        this[variableScope].enableTracking(trackingOptions);
    }.bind(this));

    if (TARGETS_WITH_REQUEST[this.target] || _.has(context, PROPERTY.REQUEST)) {
        /**
         * @note:
         * this reference is passed on as `pm.request`, pm api adds helper functions like `to` to `pm.request`
         * sandbox overrides collection Request.prototype.toJSON to remove helpers before toJSON, see `purse.js`
         */
        this.request = sdk.Request.isRequest(context.request) ? context.request : new sdk.Request(context.request);
    }

    if (TARGETS_WITH_RESPONSE[this.target] || _.has(context, PROPERTY.RESPONSE)) {
        /**
         * @note:
         * this reference is passed on as `pm.response`, pm api adds helper functions like `to` to `pm.response`
         * sandbox overrides collection Response.prototype.toJSON to remove helpers before toJSON, see `purse.js`
         */
        this.response = sdk.Response.isResponse(context.response) ?
            context.response : new sdk.Response(context.response);
    }

    this.return = {};
};

_.assign(Execution.prototype, {
    toJSON: function () {
        return _.mapValues(this, function (value) {
            // if there is no specific json serialiser, return the raw value
            if (!_.isFunction(value && value.toJSON)) {
                return value;
            }

            return value.toJSON();
        });
    }
});

module.exports = Execution;
