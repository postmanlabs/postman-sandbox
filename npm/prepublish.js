#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all required checks prior to publishing the module
// ---------------------------------------------------------------------------------------------------------------------
/* eslint-env node, es6 */

require('shelljs/global');

// trigger cache generation after clearing it
mkdir('-p', '.cache');
rm('-rf', '.cache');

require('./cache')(exit);
