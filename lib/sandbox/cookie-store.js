var util = require('util'),

    Store = require('tough-cookie').Store,

    EXECUTION_EVENT_BASE = 'execution.cookieStore.',

    PostmanCookieStore;

PostmanCookieStore = function (id, emitter, timers) {
    Store.call(this);

    this.id = id; // execution identifier
    this.emitter = emitter;
    this.timers = timers;
};

util.inherits(PostmanCookieStore, Store);

PostmanCookieStore.prototype.synchronous = false;

PostmanCookieStore.prototype.findCookie = function (domain, path, key, cb) {
    this.emitter.dispatch(
        EXECUTION_EVENT_BASE + this.id,
        this.timers.setEvent(cb),
        'findCookie',
        [domain, path, key]
    );
};

PostmanCookieStore.prototype.findCookies = function (domain, path, cb) {
    this.emitter.dispatch(
        EXECUTION_EVENT_BASE + this.id,
        this.timers.setEvent(cb),
        'findCookies',
        [domain, path]
    );
};

PostmanCookieStore.prototype.putCookie = function (cookie, cb) {
    this.emitter.dispatch(
        EXECUTION_EVENT_BASE + this.id,
        this.timers.setEvent(cb),
        'putCookie',
        [cookie]
    );
};

PostmanCookieStore.prototype.updateCookie = function (oldCookie, newCookie, cb) {
    this.putCookie(newCookie, cb);
};

PostmanCookieStore.prototype.removeCookie = function (domain, path, key, cb) {
    this.emitter.dispatch(
        EXECUTION_EVENT_BASE + this.id,
        this.timers.setEvent(cb),
        'removeCookie',
        [domain, path, key]
    );
};

PostmanCookieStore.prototype.removeCookies = function (domain, path, cb) {
    this.emitter.dispatch(
        EXECUTION_EVENT_BASE + this.id,
        this.timers.setEvent(cb),
        'removeCookies',
        [domain, path]
    );
};

PostmanCookieStore.prototype.removeAllCookies = function (cb) {
    this.emitter.dispatch(
        EXECUTION_EVENT_BASE + this.id,
        this.timers.setEvent(cb),
        'removeAllCookies',
        []
    );
};

PostmanCookieStore.prototype.getAllCookies = function (cb) {
    this.emitter.dispatch(
        EXECUTION_EVENT_BASE + this.id,
        this.timers.setEvent(cb),
        'getAllCookies',
        []
    );
};

module.exports = PostmanCookieStore;
