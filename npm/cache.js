#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to generate boot code in ".cache" directory.
// ---------------------------------------------------------------------------------------------------------------------

const _ = require('lodash'),
    async = require('async'),
    fs = require('fs'),
    chalk = require('chalk'),
    { mkdir, rm } = require('shelljs'),

    Bundle = require('../lib/bundle');

function createBundle (options, file, done) {
    async.waterfall([
        function (next) {
            Bundle.load(options).compile(next);
        },

        function (codeString, next) {
            fs.writeFile(file, `module.exports=c=>c(null,${JSON.stringify(codeString)})`, next);
        },

        function (next) {
            console.info(` - ${file}`);
            next();
        }
    ], done);
}

module.exports = function (exit) {
    mkdir('-p', '.cache'); // create a cache directory in any case

    if (_.get(process, 'argv[2]') === 'clear') {
        rm('-rf', '.cache');

        console.info('cache cleared - ".cache/*"');
        exit();
    }

    console.info(chalk.yellow.bold('Generating bootcode in ".cache" directory...'));

    const options = require('../lib/environment');

    async.parallel([
        async.apply(createBundle, _.merge({
            compress: true,
            preferBrowserResolver: false,
            bundler: { browserField: false }
        }, options), './.cache/bootcode.js'),
        async.apply(createBundle, _.merge({
            compress: true,
            preferBrowserResolver: true,
            bundler: { browserField: true }
        }, options), './.cache/bootcode.browser.js')
    ], function (err) {
        if (err) {
            console.error(err);
        }
        else {
            console.info(chalk.green('bootcode ready for use!'));
        }
        exit(err ? 1 : 0);
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(process.exit);
