var Scope = require('uniscope'),
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
        var scope = Scope.create({
            eval: true,
            ignore: ['require'],
            block: ['bridge']
        });

        /**
         * @param {String} id
         * @param {String} code
         * @param {Object} options
         * @param {Object} options.masked
         * @param {Object} options.globals
         */
        return function (id, code, options) {
            !options && (options = {});

            var bridge = this,
                cursor = options.masked && options.masked.cursor || {},
                dispatchEventName = prefix + id,
                done = (function (dispatchEventName) {
                    var sealed = false;

                    return function (err) {
                        if (sealed) { return; }
                        sealed = true;
                        bridge.dispatch(dispatchEventName, err, options);

                    };
                }(dispatchEventName));

            scope.import(scopeLibraries);
            scope.import(options.globals);
            scope.import({
                postman: postmanLegacyInterface.create(options),
                console: new PostmanConsole(bridge, cursor, options.debug ? console : null)
            });

            scope.exec(code, done);
        };
    }
};
