const _ = require('lodash'),
    PostmanSandbox = require('./postman-sandbox');

/**
 * @typedef {Object} SDK
 *
 * @property {Class} request
 * @property {Class} response
 */

/**
 * Returns the SDK classes for `request` and `response`
 *
 * @typedef {Function} initializeExecution
 *
 * @param {String} - Execution [event's]{@link http://www.postmanlabs.com/postman-collection/Event} `listen` property
 * @param {Object} - Current execution context
 * @return {SDK} - Request and response instances based on context.
 */

/**
 * ChaiJS plugin function to be passed as an argument to `chai.use`
 *
 * @see {@link https://www.chaijs.com/guide/plugins/} for details
 *
 * @typedef {Function} chaiJSPlugin
 */

/**
 * Template to govern the behavior of individual
 * sandbox instances in the fleet. It should be a
 * valid node.js code which on execution should
 * return two function using `module.exports`:
 *  - {@link initializeExecution}
 *  - {@link chaiJSPlugin}
 *
 * @typedef {String} template
 */

/**
 * Registry of templates.
 * Each template should be mapped to unique name
 * which then could be used as identifier to retrieve
 * the sandbox instance initialized by that template.
 *
 * @typedef {Object.<String, template>} templateRegistry
 */

/**
 * Options to configure PostmanSandboxFleet initialization
 *
 * @typedef initOptions
 *
 * @property {Boolean} [disableLegacyAPIs=true] - Disable legacy pm interface APIs
 * @property {Array.<String>} [disabledAPIs] - List of pm APIs to disable
 */

/**
 * Options to configure UniversalVM connection
 * for each individual PostmanSandbox instance
 *
 * @typedef connectOptions
 *
 * @property {String} [bootCode] Code to be executed inside a UVM on boot
 * @property {Number} [timeout] -
 * @property {Number} [dispatchTimeout] -
 * @property {Boolean} [debug] - Enable console logs inside UVM
 */

/**
 * Class representing a fleet of PostmanSandboxes,
 * allowing orchestration of different variants
 * of sandboxes governed by templates.
 */
class PostmanSandboxFleet {
    /**
     * Create a fleet of sandboxes
     *
     * @param {templateRegistry} registry -
     * @param {initOptions} initOptions -
     * @param {connectOptions} connectOptions -
     */
    constructor (registry, initOptions, connectOptions) {
        this.fleet = new Map();

        if (!_.isObject(registry)) {
            throw new TypeError('sandbox-fleet: template registry must be an object');
        }

        this.templateRegistry = registry;

        this.initOptions = initOptions;
        this.connectOptions = connectOptions;
    }

    /**
     * Returns sandbox instance for the given template name
     *
     * @param {String} templateName -
     * @param {Function} callback -
     * @returns {PostmanSandbox}
     */
    getContext (templateName, callback) {
        if (typeof callback !== 'function') {
            return callback(new TypeError('sandbox-fleet: callback must be a function'));
        }

        if (typeof templateName !== 'string') {
            return callback(new TypeError('sandbox-fleet: template key must be a string'));
        }

        if (this.fleet.has(templateName)) {
            return callback(null, this.fleet.get(templateName));
        }

        if (!_.has(this.templateRegistry, templateName)) {
            return callback(new Error(`sandbox-fleet: template not found for key ${templateName}`));
        }

        const template = this.templateRegistry[templateName];

        if (typeof template !== 'string') {
            return callback(new Error(`sandbox-fleet: invalid template for key ${templateName}`));
        }

        new PostmanSandbox().initialize({
            disableLegacyAPIs: true,
            ...this.initOptions,
            template: template
        }, this.connectOptions, (err, context) => {
            if (err) {
                return callback(err);
            }

            // Trapping call to `context.dispose` to do the required cleanup in the fleet
            const proxiedContext = new Proxy(context, {
                get: (target, prop, receiver) => {
                    if (prop === 'dispose') {
                        return (...args) => {
                            for (const context of this.fleet.values()) {
                                if (proxiedContext === context) {
                                    this.fleet.delete(templateName);

                                    return target[prop](...args);
                                }
                            }
                        };
                    }

                    return Reflect.get(target, prop, receiver);
                }
            });

            this.fleet.set(templateName, proxiedContext);
            callback(null, proxiedContext);
        });
    }

    /**
     * Dispose off all initialized sandbox instances from the fleet
     *
     * @returns {void}
     */
    disposeAll () {
        this.fleet.forEach((context, templateName) => {
            context.dispose();

            this.fleet.delete(templateName);
        });
    }
}

module.exports = PostmanSandboxFleet;
