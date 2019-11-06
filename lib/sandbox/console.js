var teleportJS = require('teleport-javascript'),

    arrayProtoSlice = Array.prototype.slice,

    /**
     * @constant
     * @type {String}
     */
    CONSOLE_EVENT_BASE = 'execution.console.',

    /**
     * List of functions that we expect and create for console
     * @constant
     * @type {String[]}
     */
    logLevels = ['log', 'warn', 'debug', 'info', 'error'],

    PostmanConsole;

PostmanConsole = function PostmanConsole (emitter, id, cursor, originalConsole) {
    var dispatch = function (level) { // create a dispatch function that emits events
        var args = arrayProtoSlice.call(arguments, 1);

        if (originalConsole) {
            originalConsole[level].apply(originalConsole, args);
        }

        emitter.dispatch(CONSOLE_EVENT_BASE + id, cursor, level, teleportJS.stringify(args));
    };

    // setup variants of the logger based on log levels
    logLevels.forEach(function (name) {
        this[name] = dispatch.bind(emitter, name);
    }.bind(this));
};

module.exports = PostmanConsole;
