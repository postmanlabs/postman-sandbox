#!/usr/bin/env node
/* eslint-env node, es6 */

require('shelljs/global');

var recursive = require('recursive-readdir'),
    path = require('path'),

    chalk = require('chalk'),
    async = require('async'),
    expect = require('chai').expect,
    Mocha = require('mocha'),

    SPEC_SOURCE_DIR = path.join(__dirname, '..', 'test', 'system');

module.exports = function (exit) {
    // banner line
    console.log(chalk.yellow.bold('\nRunning system tests using mocha and nsp...'));

    async.series([
        // run test specs using mocha
        function (next) {
            recursive(SPEC_SOURCE_DIR, function (err, files) {
                if (err) { console.error(err.stack || err); return next(1); }

                var mocha = new Mocha();

                files.filter(function (file) {
                    return (file.substr(-8) === '.test.js');
                }).forEach(mocha.addFile.bind(mocha));

                // start the mocha run
                global.expect = expect; // for easy reference

                mocha.run(function (err) {
                    // clear references and overrides
                    delete global.expect;

                    err && console.error(err.stack || err);
                    next(err ? 1 : 0);
                });
                // cleanup
                mocha = null;
            });
        },

        // packity
        function (next) {
            var packity = require('packity'),
                options = {
                    path: './', dev: true
                };

            packity(options, function (err, results) {
                packity.cliReporter(options)(err, results);
                next(err);
            });
        }
    ], exit);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
