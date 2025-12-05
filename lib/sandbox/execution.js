const _ = require('lodash'),
    sdk = require('postman-collection'),

    PROPERTY = {
        REQUEST: 'request',
        SCRIPT: 'script',
        DATA: 'data',
        COOKIES: 'cookies',
        RESPONSE: 'response',
        MESSAGE: 'message'
    },

    TARGETS_WITH_REQUEST = {
        test: true,
        prerequest: true
    },

    TARGETS_WITH_RESPONSE = {
        test: true
    },

    CONTEXT_VARIABLE_SCOPES = ['_variables', 'environment', 'collectionVariables', 'globals'],

    trackingOptions = { autoCompact: true };

class Execution {
    constructor (id, event, context, options) {
        this.id = id;
        this.legacy = options.legacy || {};
        this.cursor = _.isObject(options.cursor) ? options.cursor : {};
        this.event = event;
        this.data = _.get(context, PROPERTY.DATA, {});
        this.cookies = new sdk.CookieList(null, context.cookies);
        this.protocolMetadata = options.getProtocolMetadata ? options.getProtocolMetadata(this.protocolName) : {};
        this.getProtocolMetadata = options.getProtocolMetadata;

        CONTEXT_VARIABLE_SCOPES.forEach((variableScope) => {
            // normalize variable scope instances
            this[variableScope] = sdk.VariableScope.isVariableScope(context[variableScope]) ?
                context[variableScope] : new sdk.VariableScope(context[variableScope]);

            // enable change tracking
            this[variableScope].enableTracking(trackingOptions);
        });

        if (this.protocolMetadata && this.protocolMetadata.initializeExecution) {
            const { request, response, message } = this.protocolMetadata
                .initializeExecution(this.target, context) || {};

            this.request = request;
            this.response = response;
            this.message = message;
        }
        else {
            // If the associated item type does not have an initializer, then fallback to the defaults (HTTP-SDK).

            if (TARGETS_WITH_REQUEST[this.target] || _.has(context, PROPERTY.REQUEST)) {
                /**
                 * @note:
                 * this reference is passed on as `pm.request`, pm api adds helper functions like `to` to `pm.request`
                 * sandbox overrides collection Request.prototype.toJSON to remove helpers before toJSON, see `purse.js`
                 */
                this.request = sdk.Request.isRequest(context.request) ?
                    context.request : new sdk.Request(context.request);
            }

            if (TARGETS_WITH_RESPONSE[this.target] || _.has(context, PROPERTY.RESPONSE)) {
                /**
                 * @note:
                 * this reference is passed on as `pm.response`, pm api adds helper functions like `to` to `pm.response`
                 * sandbox overrides collection Response.prototype.toJSON to remove helpers before toJSON,
                 * see `purse.js`
                 */
                this.response = sdk.Response.isResponse(context.response) ?
                    context.response : new sdk.Response(context.response);
            }
        }

        /**
         * @typedef {Object} Return
         *
         * @property {Boolean} async - true if the executed script was async, false otherwise
         * @property {Visualizer} visualizer - visualizer data
         * @property {*} nextRequest - next request to send
         */
        this.return = {};
    }

    get target () {
        // Sanitize target for any protocol-specific prefixes such as `http:`, `grpc:` etc
        return (this.event.listen || PROPERTY.SCRIPT).split(/[:-]/)[1];
    }

    get protocolName () {
        // Sanitize target and get the protocol-specific prefixes such as `http`, `grpc` etc
        return (this.event.listen || PROPERTY.SCRIPT).split(/[:-]/)[0];
    }

    toJSON () {
        return _.mapValues(this, function (value) {
            // if there is no specific json serialiser, return the raw value
            if (!_.isFunction(value && value.toJSON)) {
                return value;
            }

            return value.toJSON();
        });
    }
}

module.exports = Execution;
