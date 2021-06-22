#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all unit tests in the Node VM: https://nodejs.org/api/vm.html.
// ---------------------------------------------------------------------------------------------------------------------

// set directories and files for test and coverage report
const vm = require('vm'),

    chalk = require('chalk'),
    async = require('async'),
    browserify = require('browserify'),
    recursive = require('recursive-readdir');

module.exports = function (exit) {
    console.info(chalk.yellow.bold('Loading and running the sandbox bundle tests in the Node VM'));

    async.waterfall([
        // Enlist all unit test files
        async.apply(recursive, 'test/vm'),

        // Bundle the unit test suite
        function (files, next) {
            var specs,
                bundler = browserify('test/vm/_bootstrap.js');

            // workaround to avoid "getRandomValues() not supported"
            // ref: https://github.com/uuidjs/uuid#getrandomvalues-not-supported
            bundler.require(require.resolve('../lib/vendor/uuid'), { expose: 'uuid' });

            (specs = files.filter(function (file) { // extract all test files
                return (file.substr(-8) === '.test.js');
            })).forEach(function (file) {
                // @hack to allow mocha.addFile to work correctly in the Node VM
                bundler.require('./' + file, { expose: file });
            });

            bundler.bundle(function (err, bundle) {
                next(err, specs, bundle);
            });
        },

        // Run the tests in the VM
        function (__specs, bundle, __next) {
            var context = vm.createContext({ console, setTimeout, clearTimeout, __next, __specs });

            context.global = context; // @hack to make the context work correctly

            vm.runInContext(bundle.toString(), context, { displayErrors: true });
        }
    ], exit);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
