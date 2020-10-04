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

    // First, override locales exported by faker otherwise all the locales data will be
    // bundled by browserify.
    fs.writeFileSync(require.resolve('faker/lib/locales'),
        // only export `en` locale as required by postman-collection
        // refer: https://github.com/postmanlabs/postman-collection/blob/v3.6.7/lib/superstring/dynamic-variables.js#L1
        "exports['en'] = require('./locales/en');"); // eslint-disable-line quotes

    const options = require('../lib/environment');

    async.parallel([
        async.apply(createBundle, _.merge({
            compress: true,
            bundler: { browserField: false }
        }, options), './.cache/bootcode.js'),
        async.apply(createBundle, _.merge({
            compress: true,
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
