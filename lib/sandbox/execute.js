var Scope = require('uniscope'),
    _ = require('lodash'),
    postmanLegacyInterface = require('./postman-legacy-interface'),
    PostmanConsole = require('./console'),

    scopeLibraries = {
        JSON: require('liquid-json'),
        Buffer: require('buffer'),
        _: require('lodash3').noConflict(),
        CryptoJS: require('crypto-js'),
        atob: require('atob'),
        btoa: require('btoa'),
        tv4: require('tv4'),
        xml2Json: require('./xml2Json'),
        Backbone: require('backbone'),
        cheerio: require('cheerio')
    };

module.exports = {
    listener: function (prefix, console) {
        /**
         * @param {String} id
         * @param {Code} code
         * @param {Object} options
         * @param {String} options.scriptType // @todo make sdk event
         * @param {Object} options.cursor
         * @param {Object} data
         * @param {Object~VariableScope} data.globals
         * @param {Object~VariableScope} data.environment
         * @param {Object} data.cursor
         * @param {Object} data.iterationData
         * @param {Object~Request} data.request
         * @param {Object~Response} data.response
         * @param {Object} data.legacy
         * @param {Array} data.legacy.responseCookies,
         * @param {String} data.legacy.responseBody,
         * @param {Object} data.legacy.responseCode,
         * @param {Object} data.legacy.responseHeaders,
         * @param {Object} data.legacy.responseTime
         */
        return function (id, code, options, data) {
            var bridge = this,
                cursor = options.cursor || {},
                scope = Scope.create({
                    jailed: false,
                    console: options.debug,
                    eval: true
                }, _.merge(_.clone(data), {
                    postman: postmanLegacyInterface.create(_.pick(options, 'scriptType'), data),
                    console: new PostmanConsole(bridge, cursor, options.debug ? console : null)
                }, scopeLibraries)),
                dispatchEventName = prefix + id,
                done = (function (dispatchEventName) {
                    var sealed = false;

                    return function (err) {
                        if (sealed) { return; }
                        sealed = true;
                        if (err) {
                            return bridge.dispatch(dispatchEventName, err);
                        }
                        bridge.dispatch(dispatchEventName, null, data);

                    };
                }(dispatchEventName));

            scope.exec(code, done);
        };
    }
};
