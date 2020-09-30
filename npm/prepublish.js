#!/usr/bin/env node
/* globals exit, mkdir, rm */
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all required checks prior to publishing the module
// ---------------------------------------------------------------------------------------------------------------------

require('shelljs/global');

const packity = require('packity'),
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
