# Postman Sandbox Changelog

## 2.1.5 (May 16 2017)
* Fixed bug that caused an invalid version of Collection SDK to be cached on prepublish

## 2.1.4 (15 May 2017)
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
