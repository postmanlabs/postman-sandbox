#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all unit tests in the Chrome Browser.
// ---------------------------------------------------------------------------------------------------------------------
/* eslint-env node, es6 */

require('shelljs/global');

var _ = require('lodash'),
    async = require('async'),
    fs = require('fs'),
    colors = require('colors/safe'),
    Bundle = require('../lib/bundle'),

    createBundle;

createBundle = function (options, file, done) {
    async.waterfall([
        function (next) {
            Bundle.load(options).compile(next);
        },

        function (buf, next) {
            fs.writeFile(file, `module.exports=function(d){d(null, new Buffer(${JSON.stringify(buf)}.data));};`, next);
        },

        function (next) {
            console.log(` - ${file}`);
            next();
        }
    ], done);
};

module.exports = function (exit) {
    mkdir('-p', '.cache'); // create a cache directory in any case

    if (_.get(process, 'argv[2]') === 'clear') {
        rm('-rf', '.cache');

        console.log('cache cleared - ".cache/*"');
        exit();
    }

    console.log(colors.yellow.bold('Generating bootcode in ".cache" directory...'));

    var options = require('../lib/environment');

    async.parallel([
        async.apply(createBundle, _.merge({
            compress: true,
            bundler: {browserField: false}
        }, options), './.cache/bootcode.js'),
        async.apply(createBundle, _.merge({
            compress: true,
            bundler: {browserField: true}
        }, options), './.cache/bootcode.browser.js')
    ], function (err) {
        if (err) {
            console.error(err);
        }
        else {
            console.log(colors.green('bootcode ready for use!\n' +
                'Running diff .tmp/dependencies.txt dependencies.txt\n' +
                'If this fails, please run it yourself (You can use any diff tool).'));
            exec('diff .tmp/dependencies.txt dependencies.txt');
        }
        exit(err ? 1 : 0);
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
