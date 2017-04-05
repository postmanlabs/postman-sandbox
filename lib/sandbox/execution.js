var _ = require('lodash'),
    sdk = require('postman-collection'),
    Execution; // constructor

Execution = function (event, context, options) {
    this.target = event.listen || 'script';

    this.legacy = options.legacy || {};

    this.environment = sdk.VariableScope.isVariableScope(context.environment) ?
        context.environment : new sdk.VariableScope(context.environment);
    this.globals = sdk.VariableScope.isVariableScope(context.globals) ?
        context.globals : new sdk.VariableScope(context.globals);

    if (_.has(context, 'response')) {
        this.response = sdk.Response.isResponse(context.response) ?
            context.response : new sdk.Response(context.response);
    }

    if (_.has(context, 'request')) {
        this.request = sdk.Request.isRequest(context.request) ? context.request : new sdk.Request(context.request);
    }

    _.isObject(options.cursor) && (this.cursor = options.cursor);

    this.data = _.get(context, 'data', {});
    this.cookies = _.get(context, 'cookies', []);

    this.tests = {};
    this.return = {};
};

_.assign(Execution.prototype, {
    toJSON: function () {
        return _.mapValues(this, function (value, prop) {
            // note - this is a hack to work around a limitation of CircularJSON, which strips all
            // properties that have the value "undefined". This interferes with the tests object, which
            // relies on the reference being there to mark failed tests.
            (prop === 'tests' && _.isObject(value)) && _.forOwn(value, function (test, name) {
                (value[name] === undefined) && (value[name] = false);
            });

            return _.isFunction(value && value.toJSON) ? value.toJSON() : value;
        });
    }
});

_.assign(Execution, {
    // @todo add static function here to ease up the isXYZ check in constructor
});

module.exports = Execution;
