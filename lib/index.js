var _ = require('lodash'),
    inherits = require('inherits'),
    uuid = require('uuid'),
    UniversalVM = require('uvm'),
    bootcode = require('./bootcode'),

    EXECUTION_TIMEOUT_ERROR_MESSAGE = 'sandbox: execution timeout',
    PostmanSandbox;


PostmanSandbox = function PostmanSandbox (options, callback) {
    options = _.assign({}, options); // ensure options is an object and is shallow cloned
    this.executing = {};
    this.debug = Boolean(options.debug);

    // set the dispatch timeout of UVM based on what is set in options unless original options sends the same
    _.isFinite(options.timeout) && (options.dispatchTimeout = this.executionTimeout = options.timeout);

    UniversalVM.call(this, options, function (err, context) {
        if (err) { return callback(err); }
        context.ping(function (err) {
            callback(err, context);
            context = null;
        });
    });
};

inherits(PostmanSandbox, UniversalVM);

_.assign(PostmanSandbox.prototype, {
    ping: function (callback) {
        var packet = uuid(),
            start = Date.now();

        this.once('pong', function (echo) {
            callback((echo !== packet ? new Error('sandbox: ping packet mismatch') : null), Date.now() - start, packet);
        });

        this.dispatch('ping', packet);
    },

    /**
     * @param {String} code
     * @param {Object} options
     * @param {Boolean} options.debug
     * @param {Number} options.masked.timeout
     * @param {String} options.masked.scriptType - 'test', 'prerequest'
     * @param {Object} options.globals
     * @param {Object} options.globals.environment
     * @param {Object} options.globals.globals
     * @param {Object} options.globals.request
     * @param {Object} options.globals.responseCookies
     * @param {Object} options.globals.responseHeaders
     * @param {String} options.globals.responseBody
     * @param {Number} options.globals.responseTime
     * @param {Object} options.globals.responseCode
     * @param {Object} options.globals.tests
     * @param {Number} options.globals.iteration
     * @param {Function} callback
     */
    execute: function (code, options, callback) {
        if (_.isFunction(options) && !callback) {
            callback = options;
            options = null;
        }

        !_.isObject(options) && (options = {});
        options.debug = this.debug;

        var id = uuid(),
            executionEventName = `execution.${id}`,
            executionTimeout = _.get(options, 'timeout', this.executionTimeout);

        // set execution timeout and store the interrupt in a global object (so that we can clear during dispose)
        // force trigger of the `execution.${id}` event so that the normal error flow is taken
        this.executing[id] = _.isFinite(executionTimeout) ? (setTimeout(this.emit.bind(this, executionEventName,
            new Error(EXECUTION_TIMEOUT_ERROR_MESSAGE)), executionTimeout)) : null;

        // @todo decide how the results will return in a more managed fashion
        // listen to this once, so that subsequent calls are simply dropped. especially during timeout and other
        // errors
        this.once(executionEventName, function (err, result) {
            if (this.executing.hasOwnProperty(id)) { // clear any pending timeouts
                this.executing[id] && clearTimeout(this.executing[id]);
                delete this.executing[id];
            }

            this.emit('execution', err, id, result);
            callback(err, result);
        });

        // send the code to the sendbox to be intercepted and executed
        this.dispatch('execute', id, code, options);
    },

    dispose: function () {
        _.forEach(this.executing, function (irq, id) {
            irq && clearTimeout(irq);
            this.emit(`execution.${id}`, new Error('sandbox: execution interrupted, bridge disconnecting.'));
        });
        this.disconnect();
    }
});

_.assign(PostmanSandbox, {
    create: function (options, callback) {
        return new PostmanSandbox(options, callback);
    }
});

module.exports = {
    createContext: function (options, callback) {
        if (_.isFunction(options) && !callback) {
            callback = options;
            options = {};
        }

        options = _.clone(options);
        bootcode(function (err, code) {
            if (err) { return callback(err); }
            if (!code) { return callback(new Error('sandbox: bootcode missing!')); }

            options.bootCode = code; // assign the code in options
            PostmanSandbox.create(options, callback);
        });
    }
};
