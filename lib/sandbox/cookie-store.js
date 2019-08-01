var _ = require('lodash'),
    util = require('util'),

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

PostmanCookieStore = function PostmanCookieStore (id, emitter, timers) {
    Store.call(this);

    this.id = id; // execution identifier
    this.emitter = emitter;
    this.timers = timers;
};

util.inherits(PostmanCookieStore, Store);

// Disable CookieJar's *Sync APIs
PostmanCookieStore.prototype.synchronous = false;

// attach a common handler to all store methods
STORE_METHODS.forEach(function (method) {
    PostmanCookieStore.prototype[method] = function () {
        var eventName = EXECUTION_EVENT_BASE + this.id,
            args,
            eventId,
            callback;

        // fetch all the arguments passed to the method
        args = arrayProtoSlice.call(arguments);

        // adjust arguments length based on Store's prototype method
        // eslint-disable-next-line lodash/path-style
        args.length = _.get(Store.prototype, [method, 'length'], 0);

        // move callback/last argument out of arguments
        // this will be called when timer clears the event
        callback = args.pop();

        // set event for the callback
        eventId = this.timers.setEvent(function (err, cookies) {
            if (typeof callback !== FUNCTION) {
                throw new TypeError('callback is not a function');
            }

            // methods: putCookie, updateCookie, removeCookie, removeCookies,
            //          removeAllCookies
            // or, onError
            if (err || !cookies) {
                return callback(err);
            }

            // methods: findCookies, getAllCookies
            if (Array.isArray(cookies)) {
                return callback(err, cookies.map(function (cookie) {
                    return Cookie.fromJSON(cookie); // serialize cookie object
                }));
            }

            // method: findCookie
            callback(err, Cookie.fromJSON(cookies));
        });

        // finally, dispatch event over the bridge
        this.emitter.dispatch(eventName, eventId, EVENT_STORE_ACTION, method, args);
    };
});

module.exports = PostmanCookieStore;
