var arrayProtoSlice = Array.prototype.slice,
    PostmanConsole;

PostmanConsole = function PostmanConsole (emitter, cursor, originalConsole) {
    var dispatch;

    if (originalConsole) {
        dispatch = function (level) {
            var args = arrayProtoSlice.call(arguments, 1);
            originalConsole[level].apply(originalConsole, args);

            args.unshift(level);
            args.unshift(cursor);
            args.unshift('console');
            emitter.dispatch.apply(emitter, args);
        };
    }
    else {
        dispatch = emitter.dispatch.bind(emitter, 'console', cursor);
    }

    this.log = dispatch.bind(emitter, 'log');
    this.warn = dispatch.bind(emitter, 'warn');
    this.debug = dispatch.bind(emitter, 'debug');
    this.info = dispatch.bind(emitter, 'info');
};

module.exports = PostmanConsole;
