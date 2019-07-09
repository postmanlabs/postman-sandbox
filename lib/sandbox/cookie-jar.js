var CookieJar = require('tough-cookie').CookieJar,
    PostmanCookieJar;

PostmanCookieJar = function PostmanCookieJar (cookieStore) {
    this.store = cookieStore;
    this.jar = new CookieJar(cookieStore, {looseMode: true});
};

PostmanCookieJar.prototype.get = function (url, name, callback) {
    this.jar.getCookies(url, function (err, cookies) {
        if (err) {
            return callback(err);
        }

        // WHAT!
        cookies.filter(function (cookie) {
            return cookie.key === name;
        });

        callback(err, cookies[0]);
    });
};

PostmanCookieJar.prototype.getAll = function (url, options, callback) {
    this.jar.getCookies(url, options, function (err, cookies) {
        callback(err, cookies);
    });
};

PostmanCookieJar.prototype.set = function (url, cookie, callback) {
    this.jar.setCookie(cookie, url, function (err, cookie) {
        callback(err, cookie);
    });
};

PostmanCookieJar.prototype.unset = function (url, name, callback) {
    this.store.removeCookie(url, name, function (err) {
        callback(err);
    });
};

PostmanCookieJar.prototype.clear = function (url, options, callback) {
    if (typeof url === 'function') {
        callback = url;

        this.store.removeAllCookies(function (err) {
            callback(err);
        });

        return;
    }

    this.store.removeCookies(url, options, function (err) {
        callback(err);
    });
};

module.exports = PostmanCookieJar;
