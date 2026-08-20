const _ = require('lodash'),
    sdk = require('postman-collection'),

    PROPERTY = {
        REQUEST: 'request',
        SCRIPT: 'script',
        DATA: 'data',
        COOKIES: 'cookies',
        REPORT: 'report',
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

    trackingOptions = { autoCompact: true },

    /**
     * Creates an immutable copy of a JSON-safe value without invoking accessors.
     *
     * @param {*} value -
     * @param {WeakSet<Object>} [ancestors] -
     * @returns {*} -
     * @throws {TypeError} When the value is not JSON-safe.
     */
    cloneAndFreezeJSON = function (value, ancestors = new WeakSet()) {
        if (value === null || typeof value === 'string' || typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                throw new TypeError('sandbox: report contains a non-finite number');
            }

            return value;
        }

        if (!value || typeof value !== 'object') {
            throw new TypeError('sandbox: report contains a non-JSON value');
        }

        if (ancestors.has(value)) {
            throw new TypeError('sandbox: report contains a circular reference');
        }

        ancestors.add(value);

        let clone;

        if (Array.isArray(value)) {
            clone = new Array(value.length);

            for (let index = 0; index < value.length; index++) {
                const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

                if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
                    throw new TypeError('sandbox: report contains a sparse array or accessor');
                }

                clone[index] = cloneAndFreezeJSON(descriptor.value, ancestors);
            }

            if (Object.keys(value).length !== value.length) {
                throw new TypeError('sandbox: report array contains unsupported properties');
            }
        }
        else {
            const prototype = Object.getPrototypeOf(value);

            if (prototype !== Object.prototype && prototype !== null) {
                throw new TypeError('sandbox: report contains a non-plain object');
            }

            clone = {};
            Object.keys(value).forEach((key) => {
                const descriptor = Object.getOwnPropertyDescriptor(value, key);

                if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
                    throw new TypeError('sandbox: report contains an accessor');
                }

                Object.defineProperty(clone, key, {
                    value: cloneAndFreezeJSON(descriptor.value, ancestors),
                    writable: true,
                    configurable: true,
                    enumerable: true
                });
            });
        }

        ancestors.delete(value);

        return Object.freeze(clone);
    };

class Execution {
    constructor (id, event, context, options) {
        this.id = id;
        this.target = event.listen || PROPERTY.SCRIPT;
        this.legacy = options.legacy || {};
        this.cursor = _.isObject(options.cursor) ? options.cursor : {};
        this.data = _.get(context, PROPERTY.DATA, {});
        this.cookies = new sdk.CookieList(null, context.cookies);

        if (Object.hasOwn(context, PROPERTY.REPORT)) {
            if (
                context.report !== null &&
                (!context.report || typeof context.report !== 'object' || Array.isArray(context.report))
            ) {
                throw new TypeError('sandbox: report must be a JSON object or null');
            }

            Object.defineProperty(this, PROPERTY.REPORT, {
                value: context.report === null ? null : cloneAndFreezeJSON(context.report),
                writable: false,
                configurable: false,
                enumerable: false
            });
        }

        CONTEXT_VARIABLE_SCOPES.forEach((variableScope) => {
            // normalize variable scope instances
            this[variableScope] = sdk.VariableScope.isVariableScope(context[variableScope]) ?
                context[variableScope] : new sdk.VariableScope(context[variableScope]);

            // enable change tracking
            this[variableScope].enableTracking(trackingOptions);
        });

        if (options.protocolMetadata && options.protocolMetadata.initializeExecution) {
            const { request, response, message } = options.protocolMetadata
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
