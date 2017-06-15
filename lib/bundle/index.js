var _ = require('lodash'),
    bundlingOptions = require('./bundling-options'),

    PREFER_BUILTIN = 'preferBuiltin',

    defaultCompressOptions = {
        transformer: 'uglifyify',
        options: {
            output: {ascii_only: true},
            global: true
        }
    },

    /**
     * To unite components of path in holy matrimony!
     * @return {String}
     */
    pathJoin = function () {
        return Array.prototype.join.call(arguments, '/').replace(/\/{1,}/g, '/');
    },

    browserify, // loaded inside try-catch
    browserifyBuiltins, // loaded inside try-catch
    Bundle;

// The modules for browserification should only be required during development of this module and as such a production
// installation should not even trigger require of this module. But in case it does, let's make the error message a bit
// more consumable.
try {
    browserify = require('browserify');
    browserifyBuiltins = require('browserify/lib/builtins');
}
catch (e) {
    console && console.error('sandbox: bundling triggered in production module installation mode');
    throw e;
}

/**
 * Create a bundle from an options template
 * @constructor
 *
 * @param {Object} options
 * @param {Object} options.files
 * @param {Object.<Object>} options.require
 * @param {Boolean} options.require.global
 * @param {Boolean} options.require.preferBuiltin
 * @param {String} options.require.resolve
 * @param {String} options.require.expose
 * @param {Boolean|Object} options.compress
 * @param {Array.<String>} options.ignore
 * @param {Object=} [options.bundler]
 */
Bundle = function (options) {
    /**
     * @private
     * @memberOf Bundler.prototype
     * @type {Browserify}
     */
    this.bundler = browserify(_.defaults(options.bundler, bundlingOptions)); // merge with user options

    // process any list of modules externally required and also accommodate the use of built-ins if needed
    _.forEach(options.require, function (options, resolve) {
        // allow resolution override where the required module is resolved from a different name than the one provided
        // in options
        options.resolve && (resolve = options.resolve);

        // set the name using which the module is exported to the one marked as the module name (only in case when
        // one is not explicitly provided in options.)
        !options.expose && (options.expose = resolve);

        if (_.get(options, PREFER_BUILTIN) && _.has(browserifyBuiltins, resolve)) { // @todo: add tests
            this.bundler.require(browserifyBuiltins[resolve], options);
        }
        else {
            this.bundler.require(require.resolve(resolve), options); // @todo: add tests for resolve failures
        }
    }.bind(this));

    // add the transformer for compression
    options.compress && this.bundler.transform(_.defaults(options.compress, defaultCompressOptions.options),
        defaultCompressOptions.transformer);

    // ignore the items mentioned in ignore list
    _.forEach(options.ignore, this.bundler.ignore.bind(this.bundler));

    // add files that are needed
    _.forEach(options.files, function (options, file) {
        this.bundler.add(pathJoin(__dirname, file), options);
    }.bind(this));
};

_.assign(Bundle.prototype, /** @lends Bundle.prototype */ {
    compile: function (done) {
        return this.bundler.bundle(done);
    },

    /**
     * Allows one to fetch a list of dependencies required by the bundle
     *
     * @param {Function} done - receives err, dependencies:Array
     */
    listDependencies: function (done) {
        var dependencies = [],
            addPackageToDependencies = function (pkg) {
                dependencies.push(pkg.name);
            };

        this.bundler.on('package', addPackageToDependencies);

        return this.compile(function (err) {
            this.bundler.removeListener('package', addPackageToDependencies);
            return done(err, _.uniq(dependencies).sort());
        }.bind(this));
    }
});

_.assign(Bundle, /** @lends Bundle */ {
    load: function (options) {
        return new Bundle(options);
    }
});

module.exports = Bundle;
