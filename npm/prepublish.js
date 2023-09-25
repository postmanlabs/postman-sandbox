#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all required checks prior to publishing the module.
// ---------------------------------------------------------------------------------------------------------------------

// eslint-disable-next-line security/detect-child-process
const { mkdir, rm } = require('shelljs'),
    cache = require('./cache'),
    systemTests = require('./test-system');


// trigger cache generation after clearing it
rm('-rf', '.cache');
mkdir('-p', '.cache');

cache((exitCode) => {
    exitCode && process.exit(exitCode);

    // systemTests(process.exit);
});
