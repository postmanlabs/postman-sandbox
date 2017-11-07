#!/usr/bin/env node
/* eslint-env node, es6 */

require('shelljs/global');

var fs = require('fs'),
    recursive = require('recursive-readdir'),
    path = require('path'),

    chalk = require('chalk'),
    async = require('async'),
    _ = require('lodash'),
    Mocha = require('mocha'),

    SPEC_SOURCE_DIR = path.join(__dirname, '..', 'test', 'system'),

    /**
     * Load a JSON from file synchronously
     *
     * @param {String} file
     * @returns {String}
     */
    loadJSON = function (file) {
        return JSON.parse(fs.readFileSync(path.join(__dirname, file)).toString());
    };

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

                mocha.run(function (err) {
                    err && console.error(err.stack || err);
                    next(err ? 1 : 0);
                });
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
        },

        // execute nsp
        // programmatically executing nsp is a bit tricky as we have to emulate the cli script's usage of internal
        // nsp functions.
        function (next) {
            var nsp = require('nsp'),
                pkg = loadJSON('../package.json'),
                nsprc = loadJSON('../.nsprc');

            console.log(chalk.yellow('processing nsp for security vulnerabilities...\n'));

            // we do not pass full package for privacy concerns and also to add the ability to ignore exclude packages,
            // hence we customise the package before we send it
            nsp.check({
                offline: false,
                package: {
                    name: pkg.name,
                    dependencies: _.omit(pkg.dependencies, nsprc.exclusions || [])
                }
            }, function (err, result) {
                // if processing nsp had an error, simply print that and exit
                if (err) {
                    console.error(chalk.red('There was an error processing NSP!\n') + chalk.gray(err.message || err) +
                        '\n\nSince NSP server failure is not a blocker for tests, tests are not marked as failure!');
                    return next();
                }

                // in case an nsp violation is found, we raise an error
                if (result.length) {
                    console.error(nsp.formatters.default(err, result));
                    return next(1);
                }

                console.log(chalk.green('nsp ok!\n'));
                return next();
            });
        }
    ], exit);
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
