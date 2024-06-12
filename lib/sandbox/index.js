/**!
 * @license Copyright 2016 Postdot Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 * This file is the Postman scripting sandbox's bootstrap code and would during module usage be exported as part of npm
 * cache and deployed for ease of use and performance improvements.
 *
 * @note
 * This file runs within Node and browser sandboxes and standard node aspects may not 100% apply
 */
/* global bridge */

// Setup Timerz before we delete the global timers
require('./timers');

// Although we execute the user code in a well-defined scope using the uniscope
// module but still to cutoff the reference to the globally available properties
// we sanitize the global scope by deleting the forbidden properties in this UVM
// and create a secure sandboxed environment.
// @note this is executed at the very beginning of the sandbox code to make sure
// non of the dependency can keep a reference to a global property.
// @note since this mutates the global scope, it's possible to mess-up as we
// update our dependencies.
(function recreatingTheUniverse () {
    var contextObject = this,
        // 1. allow all the uniscope allowed globals
        allowedGlobals = require('uniscope/lib/allowed-globals').concat([
            // 2. allow properties which can be controlled/ignored using uniscope
            'require', 'eval', 'console',
            // 3. allow uvm internals because these will be cleared by uvm itself at the end.
            // make sure any new property added in uvm firmware is allowed here as well.
            'bridge', '__uvm_emit', '__uvm_setTimeout'
        ]),
        deleteProperty = function (key) {
            // directly delete the property without setting it to `null` or `undefined`
            // because a few properties in browser context breaks the sandbox.
            // @note non-configurable keys are not deleted.
            // eslint-disable-next-line lodash/prefer-includes
            allowedGlobals.indexOf(key) === -1 && delete contextObject[key];
        };

    do {
        // delete all forbidden properties (including non-enumerable)
        Object.getOwnPropertyNames(contextObject).forEach(deleteProperty);
        // keep looking through the prototype chain until we reach the Object prototype
        // @note this deletes the constructor as well to make sure one can't recreate the same scope
        contextObject = Object.getPrototypeOf(contextObject);
    } while (Object.getPrototypeOf(contextObject) !== null);

    // define custom Error.prepareStackTrace
    Object.defineProperty(Error, 'prepareStackTrace', {
        value: function (error, structuredStackTrace) {
            let errorString = `Error: ${error && error.message}`;

            for (let i = 0; i < (structuredStackTrace && structuredStackTrace.length); i++) {
                errorString += `\n    at ${structuredStackTrace[i]}`;
            }

            return errorString;
        },
        configurable: false,
        enumerable: false,
        writable: false
    });
}());

// do include json purse
require('./purse');

// setup the ping-pong and execute routines
bridge.on('ping', require('./ping').listener('pong'));

// initialize execution
require('./execute')(bridge, {
    console: (typeof console !== 'undefined' ? console : null),
    window: (typeof window !== 'undefined' ? window : null)
});

// We don't need direct access to the global bridge once it's part of execution closure.
// eslint-disable-next-line no-global-assign, no-implicit-globals, no-delete-var
bridge = undefined; delete bridge;
