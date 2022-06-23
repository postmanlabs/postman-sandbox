const _ = require('lodash'),
    PostmanSandbox = require('./postman-sandbox');

class PostmanSandboxFleet {
    constructor (registry, initOptions, connectOptions) {
        this.fleet = new Map();

        if (!_.isObject(registry)) {
            throw new TypeError('sandbox-fleet: template registry must be an object');
        }

        this.templateRegistry = registry;

        this.initOptions = initOptions;
        this.connectOptions = connectOptions;
    }

    getContext (templateKey, callback) {
        if (typeof callback !== 'function') {
            return callback(new TypeError('sandbox-fleet: callback must be a function'));
        }

        if (typeof templateKey !== 'string') {
            return callback(new TypeError('sandbox-fleet: template key must be a string'));
        }

        if (this.fleet.has(templateKey)) {
            return callback(null, this.fleet.get(templateKey));
        }

        const template = this.templateRegistry[templateKey];

        if (typeof template !== 'string') {
            return callback(new Error(`sandbox-fleet: invalid template not found for key ${templateKey}`));
        }

        new PostmanSandbox().initialize({
            disableLegacyAPIs: true,
            ...this.initOptions,
            template: template
        }, this.connectOptions, (err, context) => {
            if (err) {
                return callback(err);
            }

            this.fleet.set(templateKey, context);
            callback(null, context);
        });
    }

    disposeAll () {
        this.fleet.forEach((context, templateKey) => {
            context.dispose();

            this.fleet.delete(templateKey);
        });
    }
}

module.exports = PostmanSandboxFleet;
