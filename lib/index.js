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
     * Creates a new instance of sandbox fleet based on the templates that are provided
     *
     * @param {Object.<String, String>} registry - Template registry to be used in initializing sandboxes in the fleet
     * @param {Object} [initOptions] - Options to be passed to the sandbox instance
     * @param {Boolean} [initOptions.disableLegacyAPIs=true] - Disables legacy pm interface APIs
     * @param {Array.<String>} [initOptions.disabledAPIs] - List of pm APIs to disable
     * @param {Object} [connectOptions] - Options for UVM connection
     * @param {Number} [connectOptions.timeout] -
     * @param {Number} [connectOptions.dispatchTimeout] -
     * @param {Boolean} [connectOptions.debug] -
     * @param {Function} callback -
     */
    createContextFleet (registry, initOptions, connectOptions, callback) {
        if (typeof initOptions === 'function') {
            callback = initOptions;
            initOptions = null;
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
            initOptions = {};
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
