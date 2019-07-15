var CookieJar = require('tough-cookie').CookieJar,
    ToughCookie = require('tough-cookie').Cookie,
    PostmanCookie = require('postman-collection').Cookie,
    urlParse = require('url').parse,

    FUNCTION = 'function',

    getCookieContext = function (url) {
        if (url instanceof Object) {
            return url;
        }

        try {
            url = decodeURI(url);
        }
        catch (err) {
            // Silently swallow error
        }

        return urlParse(url);
    },

    // PostmanCookie to ToughCookie
    serialize = function (pmCookie) {
        if (!pmCookie) {
            return;
        }

        let serializedCookie = ToughCookie.parse(PostmanCookie.toString(pmCookie));

        // set hostOnly property if the cookie is HostOnly
        if (pmCookie.hostOnly) {
            serializedCookie.hostOnly = true;
        }

        return serializedCookie;
    },

    // ToughCookie to PostmanCookie
    deserialize = function (toughCookie) {
        return PostmanCookie.parse(ToughCookie.prototype.toString.call(toughCookie));
    },

    PostmanCookieJar;

PostmanCookieJar = function PostmanCookieJar (cookieStore) {
    this.store = cookieStore;
    this.jar = new CookieJar(cookieStore, {
        rejectPublicSuffixes: false,
        looseMode: true
    });
};

PostmanCookieJar.prototype.get = function (url, name, callback) {
    var done = function (err, cookies) {
        typeof callback === FUNCTION && callback(err, cookies);
    };

    this.jar.getCookies(url, function (err, cookies) {
        var i,
            ii;

        if (err) {
            return done(err);
        }

        if (!(cookies && cookies.length)) {
            return done(null);
        }

        // @todo add CookieJar~getCookie to avoid this
        for (i = 0, ii = cookies.length; i < ii; i++) {
            if (cookies[i].key === name) {
                return done(null, deserialize(cookies[i]));
            }
        }

        done(null);
    });
};

PostmanCookieJar.prototype.getAll = function (url, options, callback) {
    if (typeof options === FUNCTION && !callback) {
        callback = options;
        options = {};
    }

    this.jar.getCookies(url, options, function (err, cookies) {
        typeof callback === FUNCTION && callback(err, cookies.map(deserialize));
    });
};

PostmanCookieJar.prototype.set = function (url, cookie, callback) {
    if (PostmanCookie.isCookie(cookie)) {
        cookie = serialize(cookie);
    }

    this.jar.setCookie(cookie, url, function (err, cookie) {
        typeof callback === FUNCTION && callback(err, deserialize(cookie));
    });
};

PostmanCookieJar.prototype.unset = function (url, name, callback) {
    var context = getCookieContext(url);

    this.store.removeCookie(context.hostname, context.pathname, name, function (err) {
        typeof callback === FUNCTION && callback(err);
    });
};

PostmanCookieJar.prototype.clear = function (url, callback) {
    if (typeof url === FUNCTION) {
        callback = url;

        this.store.removeAllCookies(function (err) {
            callback(err);
        });

        return;
    }

    var context = getCookieContext(url);

    // @todo we can add options here to solve user-case like:
    // delete all `Secure` cookie; delete all cookies with name `foo` etc.
    this.store.removeCookies(context.hostname, context.pathname, function (err) {
        typeof callback === FUNCTION && callback(err);
    });
};

module.exports = PostmanCookieJar;
