const _ = require('lodash'),
    bootcode = require('./bootcode'),
    PostmanSandbox = require('./postman-sandbox'),
    PostmanSandboxFleet = require('./postman-sandbox-fleet');

module.exports = {
    /**
     * Creates a new instance of sandbox from the options that have been provided
     *
     * @param {Object=} [options] -
     * @param {Function} callback -
     */
    createContext (options, callback) {
        if (_.isFunction(options) && !callback) {
            callback = options;
            options = {};
        }

        options = _.clone(options);
        bootcode((err, code) => {
            if (err) { return callback(err); }
            if (!code) { return callback(new Error('sandbox: bootcode missing!')); }

            options.bootCode = code; // assign the code in options

            new PostmanSandbox().initialize({}, options, callback);
        });
    },

    /**
     * Creates a new instance of sandbox fleet based on the give templates
     *
     * @param {PostmanSandboxFleet.templateRegistry} registry -
     * @param {PostmanSandboxFleet.initOptions} [initOptions] -
     * @param {PostmanSandboxFleet.connectOptions} [connectOptions] -
     * @param {Function} callback -
     */
    createContextFleet (registry, initOptions, connectOptions, callback) {
        if (typeof initOptions === 'function') {
            callback = initOptions;
            initOptions = null;
            connectOptions = null;
        }
        else if (typeof connectOptions === 'function') {
            callback = connectOptions;
            connectOptions = null;
        }

        if (typeof callback !== 'function') {
            return callback(new TypeError('sandbox: callback must be a function'));
        }

        if (!_.isObject(initOptions)) {
            initOptions = {};
        }

        if (!_.isObject(connectOptions)) {
            connectOptions = {};
        }

        connectOptions = _.clone(connectOptions);

        bootcode((err, code) => {
            if (err) { return callback(err); }
            if (!code) { return callback(new Error('sandbox: bootcode missing!')); }

            connectOptions.bootCode = code;

            try {
                const sandboxFleet = new PostmanSandboxFleet(registry, initOptions, connectOptions);

                return callback(null, sandboxFleet);
            }
            catch (err) {
                return callback(err);
            }
        });
    }
};
