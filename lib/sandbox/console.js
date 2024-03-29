var teleportJS = require('teleport-javascript'),

    arrayProtoSlice = Array.prototype.slice,

    /**
     * @constant
     * @type {String}
     */
    CONSOLE_EVENT = 'execution.console',

    /**
     * List of functions that we expect and create for console
     *
     * @constant
     * @type {String[]}
     */
    logLevels = ['log', 'warn', 'debug', 'info', 'error', 'clear'];

/**
 * Replacer to be used with teleport-javascript to handle cases which are not
 * handled by it.
 *
 * @param {String} key - Key of the property to replace
 * @param {Any} value - Value of property to replace
 * @return {Any} Replaced value
 */
function replacer (key, value) {
    if (typeof value === 'function') {
        const fnType = (value.constructor && value.constructor.name) ?
            value.constructor.name : 'Function';

        return value.name ? `[${fnType}: ${value.name}]` : `[${fnType}]`;
    }

    if (value instanceof WeakMap) {
        return '[WeakMap]';
    }
    else if (value instanceof WeakSet) {
        return '[WeakSet]';
    }
    else if (value instanceof ArrayBuffer) {
        return `[ArrayBuffer { byteLength: ${value.byteLength} }]`;
    }

    return value;
}

function PostmanConsole (emitter, cursor, originalConsole) {
    const dispatch = function (level) { // create a dispatch function that emits events
        const args = arrayProtoSlice.call(arguments, 1);

        if (originalConsole) {
            // eslint-disable-next-line prefer-spread
            originalConsole[level].apply(originalConsole, args);
        }

        emitter.dispatch(CONSOLE_EVENT, cursor, level, teleportJS.stringify(args, replacer));
    };

    // setup variants of the logger based on log levels
    logLevels.forEach((name) => {
        this[name] = dispatch.bind(emitter, name);
    });
}

module.exports = PostmanConsole;
