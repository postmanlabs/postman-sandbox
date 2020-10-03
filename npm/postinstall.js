#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to execute all required checks after a package is installed.
// ---------------------------------------------------------------------------------------------------------------------

const fs = require('fs'),
    chalk = require('chalk'),

    FAKER_LOCALES = 'faker/lib/locales';

console.info(chalk.yellow.bold('Overriding "faker" module content...'));

try {
    // Override locales exported by faker otherwise all the locales data will be
    // bundled by browserify.
    fs.writeFileSync(require.resolve(FAKER_LOCALES),
        // only export `en` locale as required by postman-collection
        // refer: https://github.com/postmanlabs/postman-collection/blob/v3.6.7/lib/superstring/dynamic-variables.js#L1
        "exports['en'] = require('./locales/en');"); // eslint-disable-line quotes

    const locales = Object.keys(require(FAKER_LOCALES));

    if (!(locales.length === 1 && locales[0] === 'en')) {
        throw new Error('faker locales overriding failed.');
    }
}
catch (error) {
    console.info(chalk.red.bold(error));
    process.exit(1);
}
