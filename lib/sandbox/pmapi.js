var _assignDefinedReadonly = function (obj, properties) {
        var config = {
                writable: false
            },

            prop;

        for (prop in properties) {
            if (properties.hasOwnProperty(prop) && (properties[prop] !== undefined)) {
                config.value = properties[prop];
                Object.defineProperty(obj, prop, config);
            }
        }
    },

    Postman;

Postman = function Postman (execution) {
    if (!execution) {
        return;
    }

    _assignDefinedReadonly(this, /** @lends Postman.prototype */ {
        /**
         * @type {VariableScope}
         */
        globals: execution.globals,

        /**
         * @type {VariableScope}
         */
        environment: execution.environment,

        /**
         * @type {Request}
         */
        request: execution.request,

        /**
         * @type {Response}
         */
        response: execution.response
    });
};

Postman.prototype.expect = require('chai').expect;

module.exports = Postman;
