# Postman Sandbox Changelog

#### v3.1.1 (June 30, 2018)
* Fixed a bug that caused executions to crash when context variables have tracked mutations

#### v3.1.0 (June 28, 2018)
* Added change tracking to sandbox variables. Now execution result has `mutations` which has recorded
all the changes that were made during the script execution.
* Updated dependencies

#### v3.0.8 (May 24, 2018)
* Updated dependencies

#### v3.0.7 (May 16, 2018)
* Updated dependencies

#### v3.0.6 (April 10, 2018)
* Reverted #273: Chai assignment fix :bug:

#### v3.0.5 (April 9, 2018)
* Updated dependencies :arrow_up:
* Fixed a bug that caused negated assertions to persist :bug:
* Updated `uvm` to `v1.7.1`, which fixes iframe bootcode loading for large bundles :bug:
* Updated `chai-postman` to `v1.0.2`, which fixes a response status assertion bug :bug:

### v3.0.4 (November 30, 2017)
* :arrow_up: Updated dependencies.

### v3.0.3 (November 20, 2017)
* :tada: Get and set objects in variables with `json` type
```js
// set objects as values for `json types`
pm.variables.set('myObject', { version: 'v1' }, 'json');

// get object values
console.log(pm.variables.get('myObject')); // { version: 'v1' }
console.log(typeof pm.variables.get('myObject')); // object
```

### v3.0.2 (November 9, 2017)
* Made error messages for legacy test failure assertions useful

### v3.0.1 (November 8, 2017)
* :bug: Fixed a bug where assertions for legacy test failures did not include the assertion `error`.
* :arrow_up: Updated dependencies.

#### v3.0.0 (November 7, 2017)
* [BREAKING] `execution.assertion` and `execution.assertions.${id}` events are now passed with array of assertions
* :tada: Added support for collection variables using `collectionVariables`
* :tada: Variables set with `pm.variables` state are now bubbled with `execution.result.${id}` as `_variables`
* :arrow_up: Updated dependencies.

#### v2.3.5 (October 13, 2017)
* :arrow_up: Updated dependencies.
* :tada: Replaced in-house chai assertion extensions with [chai-postman](https://github.com/postmanlabs/chai-postman) #212.

#### v2.3.4 (September 27, 2017)
* :bug: Fixed a bug that caused internal assertion helpers to be leaked #203
* :bug: Shifted `browserify` to `devDependencies`, thereby reducing package size. #196
* :bug: Fixed script timeout bug #193.
* :bug: Added support for `console.error` #186.

#### v2.3.3 (August 28, 2017)
* :arrow_up: Bumped `xml2js` to `v0.4.19`. #178
* :arrow_up: Bumped `postman-collection` to `v2.1.3`. #180

#### v2.3.2 (August 21, 2017)
* :bug: Fixed an issue that caused missing headers in assertions to crash test scripts. #176
* :arrow_up: Updated `csv-parse` to v1.2.1 #156

#### v2.3.1 (August 18, 2017)
* Updated dependencies.
* Added `url`, `punycode`, and `querystring` to the Sandbox.
* :clock1: Support for timers inside sandbox (not in browser) #106
* Prevented disabled headers from showing up in `request.headers` in the sandbox. #169
* Fixed bug where `pm.test` called without an assertion function would not trigger assertion event.
* Added `pm.sendRequest` which dispatches event `execution.request.${id}` and expects `execution.response.${id}`

#### 2.3.0 (June 27, 2017)
* Updated dependencies
* Added csv-parse (synchronous) to the sandbox #133

#### 2.2.0 (June 14, 2017)
* Updated dependencies
* Added moment (without locales) to the Sandbox #122

#### 2.1.5 (May 16, 2017)
* Fixed bug that caused an invalid version of Collection SDK to be cached on prepublish

#### 2.1.4 (May 15, 2017)
* chore(package): update postman-collection to version 1.2.5

#### 2.1.3 (May 12, 2017)
* Updated `uniscope` to v1.1.1, which contains a bugfix for handling falsey globals
* Introduced `pm.variables` as a unified interface for variable access
* Renamed `pm.data` to `pm.iterationData`, exposed as a `VariableScope`

#### 2.1.2 (May 8, 2017)
* Assertion event indices now begin with `0` (#89)

#### 2.1.1 (April 25, 2017)
* Added request and response assertions in form of `pm.request.to` and `pm.response.to`
* `pm.cookies` is now available.

#### 2.1.0 (April 13, 2017)
* Initial release of the `pm` API.
* `pm.globals`, `pm.environment` - [VariableScope](http://www.postmanlabs.com/postman-collection/VariableScope.html)s
* `pm.request` - [Request](http://www.postmanlabs.com/postman-collection/Request.html)
* `pm.response` - [Response](http://www.postmanlabs.com/postman-collection/Response.html) (only available in test scripts)

#### 2.0.0 (April 05, 2017)
* Removed legacy handling of environment and collections (both are now `VariableScope`s
* Introduced a standardized execution result object, `Execution`
* Removed the `masked` options which were used by the sandbox

#### 1.0.1 (January 06, 2017)
* Shifted to deprecated `new Buffer()` function for full node v4 compatibility
* Dependency shift from optional dependencies to dev dependencies
* Shifted to deprecated `new Buffer()` function for full node v4 compatibility
* Tests for BOM support in JSON.parse

#### 1.0.0 (December 29, 2016)
* Fixed missing clear immediate

#### 0.0.1-beta.11 (December 27, 2016)
* Added the missing clearImmediate stub timer

#### 0.0.1-beta.10 (December 27, 2016)
* Replaced deprecated buffer-browserify with feross buffer and added tests
* User error and informational console events
* Fixed issue with XMLHttpRequest variable name being incorrect inside sandbox
* Fix binding issue of the stub timers.
* Added stub timer functions that do nothing except trigger console message
* Compatibility with Postman Legacy sandbox framework (and other improvements)
* Sandbox library tests

#### 0.0.1-beta.9 (December 21, 2016)
* Added UVM with external iframe support for sandboxed chrome packaged apps

#### 0.0.1-beta.8 (December 20, 2016)
* Added additional relaxations of sandbox + jQuery for browser variant
* Updated UVM to beta version which supports timeouts.
* Added tests to check state of optional dependencies
* Update to accept parameter changes in UVM

#### 0.0.1-beta.7 (December 16, 2016)
* Made Postman execute use a common scope object
* Fix crypto-js dependency release issue.

#### 0.0.1-beta.6 (December 2, 2016)
* Bugfix using loads merge instead of assign!
* Made all executions follow legacy IO structure
* Updated uniscope to a non buggy unjailed mode version
* Added fully functional PostmanConsole inside library
* Ensured that xml2js is exposed as xml2Json instead of original library inside sandbox

#### 0.0.1-beta.5 (December 1, 2016)
* Added test for loads library inside sandbox
* Made default bundling option detect globals
* Moved requirement of sandbox globals to inside scope execution and ran it in unjailed mode
* Fixed bug with context.dispose trying to access undefined variable

#### 0.0.1-beta.4 (November 30, 2016)
* Added console support
* Added polymorphism to the data argument of execution
* Made execution debug options be inherited during construction
* Made the sandbox execute event accept the current (legacy) data format
* Made sandbox load files relative to itself

#### 0.0.1-beta.3 (November 30, 2016)
* Made the file loading of bundler use absolute path
* Move vendor out one level

#### 0.0.1-beta.2 (November 30, 2016)
* Made the dependency on bundling not be needed if cache is present
* Added pre-publish script for initial testing

#### 0.0.1-beta.1 (November 2016)
* Added initial codebase
* Added boilerplate configuration files.
