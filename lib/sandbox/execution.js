var _ = require('lodash'),
    sdk = require('postman-collection'),

    PROPERTY = {
        REQUEST: 'request',
        SCRIPT: 'script',
        DATA: 'data',
        COOKIES: 'cookies',
        RESPONSE: 'response',
        TESTS: 'tests'
    },

    TARGETS_WITH_REQUEST = {
        test: true,
        prerequest: true
    },

    TARGETS_WITH_RESPONSE = {
        test: true
    },

    Execution; // constructor

Execution = function (id, event, context, options) {
    this.id = id;
    this.target = event.listen || PROPERTY.SCRIPT;
    this.legacy = options.legacy || {};
    this.cursor = _.isObject(options.cursor) ? options.cursor : {};

    this.data = _.get(context, PROPERTY.DATA, {});
    this.cookies = new sdk.PropertyList(sdk.Cookie, null, context.cookies);

    this.environment = sdk.VariableScope.isVariableScope(context.environment) ?
        context.environment : new sdk.VariableScope(context.environment);
    this.globals = sdk.VariableScope.isVariableScope(context.globals) ?
        context.globals : new sdk.VariableScope(context.globals);

    if (TARGETS_WITH_REQUEST[this.target] || _.has(context, PROPERTY.REQUEST)) {
        this.request = sdk.Request.isRequest(context.request) ? context.request : new sdk.Request(context.request);
    }

    if (TARGETS_WITH_RESPONSE[this.target] || _.has(context, PROPERTY.RESPONSE)) {
        this.response = sdk.Response.isResponse(context.response) ?
            context.response : new sdk.Response(context.response);
    }

    this.tests = {};
    this.return = {};
};

_.assign(Execution.prototype, {
    toJSON: function () {
        return _.mapValues(this, function (value, prop) {
            // note - this is a hack to work around a limitation of CircularJSON, which strips all
            // properties that have the value "undefined". This interferes with the tests object, which
            // relies on the reference being there to mark failed tests.
            (prop === PROPERTY.TESTS && _.isObject(value)) && _.forOwn(value, function (test, name) {
                (value[name] === undefined) && (value[name] = false);
            });

            // if there is no specific json serialiser, return the raw value
            if (!_.isFunction(value && value.toJSON)) {
                return value;
            }

            var json,
                tmp;

            // remove assertion during json export (avoids circular object issues with chai)
            if ((prop === PROPERTY.REQUEST || prop === PROPERTY.RESPONSE) && _.has(value, 'to')) {
                tmp = value.to;
                delete value.to;
                json = value.toJSON();
                value.to = tmp;
                return json;
            }

            return value.toJSON();
        });
    }
});

module.exports = Execution;
