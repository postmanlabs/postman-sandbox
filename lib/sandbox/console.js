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

/**
 * Replacer to be used with teleport-javascript to handle cases which are not
 * handled by it.
 *
 * @param {String} key - Key of the property to replace
 * @param {Any} value - Value of property to replace
 * @return {Any} Replaced value
 */
function replacer (key, value) {
    // handle function value
    if (typeof value === 'function') {
        return value.name ? `[Function: ${value.name}]` : '[Function]';
    }

    // bail if value is not object or is undefined
    if (!(value && typeof value === 'object')) {
        return value;
    }

    var objectType = value.constructor && value.constructor.name;

    switch (objectType) {
        // if the user deletes the `constructor` for the type, we let
        // `teleport-javascript` handle what is to be done.
        case undefined:
            return value;

        // bail if type is already supported by teleport-javascript
        case 'Object':
        case 'Array':
        case 'RegExp':
        case 'Map':
        case 'Set':
            return value;

        default:
            return `[${objectType}]`;
    }
}

PostmanConsole = function PostmanConsole (emitter, id, cursor, originalConsole) {
    var dispatch = function (level) { // create a dispatch function that emits events
        var args = arrayProtoSlice.call(arguments, 1);

        if (originalConsole) {
            originalConsole[level].apply(originalConsole, args);
        }

        emitter.dispatch(CONSOLE_EVENT_BASE + id, cursor, level, teleportJS.stringify(args, replacer));
    };

    // setup variants of the logger based on log levels
    logLevels.forEach(function (name) {
        this[name] = dispatch.bind(emitter, name);
    }.bind(this));
};

module.exports = PostmanConsole;
