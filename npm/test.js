#!/usr/bin/env node
/* eslint-env node, es6 */
require('shelljs/global');

var async = require('async'),
    colors = require('colors/safe');

async.series([
    require('./test-lint'),
    require('./test-system'),
    require('./cache'),
    require('./test-unit'),
    require('./test-vm'),
    require('./test-integration'),
    require('./test-browser')
], function (code) {
    !code && console.log(colors.green('\n' + require('../package.json').name + ' tests: all ok!'));
    exit(code);
});
