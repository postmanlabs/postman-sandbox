var arrayProtoSlice = Array.prototype.slice,

    /**
     * @constant
     * @type {String}
     */
    CONSOLE = 'console',

    /**
     * List of functions that we expect and create for console
     * @constant
     * @type {String[]}
     */
    logLevels = ['log', 'warn', 'debug', 'info', 'error'],

    PostmanConsole;

PostmanConsole = function PostmanConsole (emitter, cursor, originalConsole) {
    var dispatch = (originalConsole ? function (level) { // create a dispatch function that emits events
        var args = arrayProtoSlice.call(arguments, 1);
        originalConsole[level].apply(originalConsole, args);

        args.unshift(CONSOLE, cursor, level);
        emitter.dispatch.apply(emitter, args);
    } : emitter.dispatch.bind(emitter, CONSOLE, cursor)); // bind only to emitter if no original console is sent

    // setup variants of the logger based on log levels
    logLevels.forEach(function (name) {
        this[name] = dispatch.bind(emitter, name);
    }.bind(this));
};

module.exports = PostmanConsole;
