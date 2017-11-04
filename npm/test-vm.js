#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all unit tests in the Node VM: https://nodejs.org/api/vm.html.
// ---------------------------------------------------------------------------------------------------------------------
/* eslint-env node, es6 */

require('shelljs/global');

// set directories and files for test and coverage report
var vm = require('vm'),

    chalk = require('chalk'),
    async = require('async'),
    browserify = require('browserify'),
    recursive = require('recursive-readdir');

/* globals exit */
module.exports = function (exit) {
    console.info(chalk.yellow.bold('Loading and running the sandbox bundle tests in the Node VM'));

    async.waterfall([
        // Enlist all unit test files
        async.apply(recursive, 'test/vm'),

        // Bundle the unit test suite
        function (files, next) {
            var specs,
                bundler = browserify('test/vm/_bootstrap.js');

            (specs = files.filter(function (file) { // extract all test files
                return (file.substr(-8) === '.test.js');
            })).forEach(function (file) {
                // @hack to allow mocha.addFile to work correctly in the Node VM
                bundler.require('./' + file, {expose: file});
            });

            bundler.bundle(function (err, bundle) {
                next(err, specs, bundle);
            });
        },

        // Run the tests in the VM
        function (specs, bundle, next) {
            var context = vm.createContext({console, setTimeout, clearTimeout, __next: next, __specs: specs});

            context.global = context; // @hack to make the context work correctly

            vm.runInContext(bundle.toString(), context, {displayErrors: true});
        }
    ], exit);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
