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
/* global require, bridge */

// something is off with the `assert` browserify module and as such, need this hack to avoid error
// `util.inherits is not a function`
require('util').inherits = require('inherits');

// do include json purse
require('./purse');

// setup the ping-pong and execute routines
bridge.on('ping', require('./ping').listener('pong'));

// initialise execution
require('./execute')(bridge, {
    console: (typeof console !== 'undefined' ? console : null),
    window: (typeof window !== 'undefined' ? window : null)
});
