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
         * @param {Object} options.masked
         * @param {Object} options.globals
         */
        return function (id, code, options) {
            !options && (options = {});

            var bridge = this,
                cursor = _.get(options, 'masked.cursor', {}),
                scope = Scope.create({
                    jailed: false,
                    console: options.debug,
                    eval: true
                }, _.assign({}, options.globals, {
                    postman: postmanLegacyInterface.create(_.get(options, 'masked.scriptType'), options),
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

                        bridge.dispatch(dispatchEventName, null, options);

                    };
                }(dispatchEventName));

            scope.exec(code, done);
        };
    }
};
