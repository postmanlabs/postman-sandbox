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

// do include json purse
require('./purse');

/* global require, bridge */
JSON = require('liquid-json'); // eslint-disable-line no-implicit-globals, no-native-reassign
Buffer = require('buffer'); // eslint-disable-line no-implicit-globals, no-native-reassign
_ = require('lodash3').noConflict(); // eslint-disable-line no-implicit-globals, no-native-reassign
CryptoJS = require('crypto-js'); // eslint-disable-line no-implicit-globals, no-native-reassign
atob = require('atob'); // eslint-disable-line no-implicit-globals, no-native-reassign
btoa = require('btoa'); // eslint-disable-line no-implicit-globals, no-native-reassign
tv4 = require('tv4'); // eslint-disable-line no-implicit-globals, no-native-reassign
xml2js = require('xml2js'); // eslint-disable-line no-implicit-globals, no-native-reassign
Backbone = require('backbone'); // eslint-disable-line no-implicit-globals, no-native-reassign
cheerio = require('cheerio'); // eslint-disable-line no-implicit-globals, no-native-reassign

// Setup the ping-pong and execute routines
bridge.on('ping', require('./ping').listener('pong'));
bridge.on('execute', require('./execute').listener('execution.', this));

// cleanup globals. nothing else should need bridge or require
// bridge = undefined; // eslint-disable-line no-implicit-globals, no-native-reassign
// require = undefined; // eslint-disable-line no-implicit-globals, no-native-reassign
