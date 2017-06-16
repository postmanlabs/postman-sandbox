#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all required checks prior to publishing the module
// ---------------------------------------------------------------------------------------------------------------------
/* eslint-env node, es6 */
/* globals exit, mkdir, rm */

require('shelljs/global');

var packity = require('packity'),
    options = {
        path: './', dev: true
    };

// trigger cache generation after clearing it
mkdir('-p', '.cache');
rm('-rf', '.cache');

packity(options, function (err, results) {
    packity.cliReporter(options)(err, results);

    if (err) { return exit(1); }

    require('./cache')(exit);
});
