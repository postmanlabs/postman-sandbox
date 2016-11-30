var Scope = require('uniscope'),
    postmanLegacyInterface = require('./postman-legacy-interface');

module.exports = {
    listener: function (prefix) {
        /**
         * @param {String} id
         * @param {Code} code
         * @param {Object} options
         * @param {String} options.scriptType // @todo make sdk event
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
                legacyInterface = postmanLegacyInterface.create(_.pick(options, 'scriptType'), _.get(data, 'legacy')),
                scope = Scope.create({
                    console: options.debug,
                    eval: true
                }, {
                    postman: legacyInterface
                }),
                dispatchEventName = prefix + id,
                done = (function (dispatchEventName) {
                    var sealed = false;

                    return function (err) {
                        if (sealed) { return; }
                        sealed = true;
                        bridge.dispatch(dispatchEventName, err || null);
                    };
                }(dispatchEventName));

            scope.exec(code, done);
        };
    }
};
