const _ = require('lodash'),
    env = require('./environment');

let cache,
    bundler,
    cacher;

// we first try and load the pre-bundled file from file-cache. file cache might be absent during development phase and
// as such, we fall back to live bundling.
try {
    bundler = require('../.cache/bootcode');
}
catch (e) {
    console && console.info('sandbox: ' + e.message + '\n' +
        'bootcode is being live compiled. use `npm run cache` to use cached variant.');
}

// in case bundler is not a valid function, we create a bundler that uses the environment to compile sandbox bootstrap
// code
!_.isFunction(bundler) && (bundler = function (done) {
    require('./bundle').load(env).compile(done);
});

cacher = function (done) {
    // in case the cache is already populated, we simply forward the cached string to the caller
    if (cache) {
        return done(null, cache);
    }

    // since the code is not cached, we fetch the code from the bundler (it could be file cached or live compiled) and
    // then cache it before forwarding it to caller.
    bundler(function (err, code) {
        if (err) { return done(err); }

        // ensure buffer is stringified before being cached
        (code && !_.isString(code)) && (code = code.toString());
        if (code && _.isString(code)) { // before caching we check the code as string once more
            cache = code;
            cacher.cached = true; // a flag to aid debugging
        }

        return done(null, cache);
    });
};

module.exports = cacher;
