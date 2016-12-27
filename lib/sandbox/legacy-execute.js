var Scope = require('uniscope'),
    postmanLegacyInterface = require('./postman-legacy-interface'),
    PostmanConsole = require('./console'),
    StubTimers = require('./stub-timers'),

    MULTIPLE_DONE_MESSAGE = 'script execution completion callback executed more than once.',

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
    };

module.exports = {
    listener: function (prefix, console, window) {
        var scope = Scope.create({
            eval: true,
            ignore: window ? ['require', 'window', 'document'] : ['require'],
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
                postmanConsole = new PostmanConsole(bridge, cursor, options.debug ? console : null),
                dispatchEventName = prefix + id,
                done = (function (dispatchEventName) {
                    var sealed = false;

                    return function (err) {
                        if (sealed) { return postmanConsole.info(MULTIPLE_DONE_MESSAGE); }
                        sealed = true;

                        err && bridge.dispatch('error.execution', cursor, err, id);
                        bridge.dispatch(dispatchEventName, err, options);

                    };
                }(dispatchEventName));

            scope.import(scopeLibraries);
            scope.import(options.globals);
            scope.import(new StubTimers(postmanConsole));
            scope.import({
                postman: postmanLegacyInterface.create(options),
                console: postmanConsole
            });

            // do browser specific imports as a special case for jquery
            window && scope.import({
                XMLHttpRequest: window.XMLHttpRequest,
                $: require('jquery'),
                jQuery: require('jquery')
            });

            scope.exec(code, done);
        };
    }
};
