var util = require('util'),

    Store = require('tough-cookie').Store,
    Cookie = require('tough-cookie').Cookie,

    EXECUTION_EVENT_BASE = 'execution.cookies.',
    EVENT_STORE_ACTION = 'store',
    STORE_METHODS = [
        'findCookie', 'findCookies', 'putCookie', 'updateCookie',
        'removeCookie', 'removeCookies', 'removeAllCookies', 'getAllCookies'
    ],
    FUNCTION = 'function',

    arrayProtoSlice = Array.prototype.slice,
    PostmanCookieStore;

PostmanCookieStore = function (id, emitter, timers) {
    Store.call(this);

    this.id = id; // execution identifier
    this.emitter = emitter;
    this.timers = timers;
};

util.inherits(PostmanCookieStore, Store);

// Disable CookieJar's *Sync APIs
PostmanCookieStore.prototype.synchronous = false;

STORE_METHODS.forEach(function (method) {
    PostmanCookieStore.prototype[method] = function () {
        var args = arrayProtoSlice.call(arguments),
            cb = args.pop(),
            callback;

        callback = function (err, cookies) {
            if (typeof cb !== FUNCTION) {
                return;
            }

            if (err) {
                return cb(err);
            }

            if (Array.isArray(cookies)) {
                return cb(err, cookies.map(function (cookie) {
                    return Cookie.fromJSON(cookie);
                }));
            }

            cb(err, cookies && Cookie.fromJSON(cookies));
        };

        this.emitter.dispatch(
            EXECUTION_EVENT_BASE + this.id,
            this.timers.setEvent(callback),
            EVENT_STORE_ACTION,
            method,
            args
        );
    };
});

module.exports = PostmanCookieStore;
