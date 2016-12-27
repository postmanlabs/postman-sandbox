/**
 * @module sandbox-timers
 * This module's job is to expose stub timer functions that raise warning when called.
 * @type {Object}
 */

var timerFunctions = ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate'],
    MESSAGE = ' is not available inside sandbox and has no side-effect.',

    SandboxTimers;

SandboxTimers = function (console) {
    var notSupported = function (name) {
        console.info(name + MESSAGE);
    };

    timerFunctions.forEach(function (name) {
        this[name] = notSupported.bind({}, name);
    }.bind(this));
};

module.exports = SandboxTimers;
