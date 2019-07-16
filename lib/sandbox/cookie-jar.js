var CookieJar = require('tough-cookie').CookieJar,
    ToughCookie = require('tough-cookie').Cookie,
    PostmanCookie = require('postman-collection').Cookie,
    Url = require('postman-collection').Url,

    FUNCTION = 'function',
    OBJECT = 'object',
    STRING = 'string',

    // PostmanCookie to ToughCookie
    serialize = function (cookie) {
        if (!cookie || typeof cookie !== OBJECT) {
            cookie = {};
        }

        return ToughCookie.fromJSON({
            key: cookie.name || cookie.key,
            value: cookie.value,
            expires: cookie.expires,
            maxAge: cookie.maxAge,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            hostOnly: cookie.hostOnly,
            extensions: cookie.extensions
        });
    },

    // ToughCookie to PostmanCookie
    deserialize = function (cookie) {
        if (!cookie || typeof cookie !== OBJECT) {
            cookie = {};
        }

        return new PostmanCookie({
            name: cookie.key,
            value: cookie.value,
            expires: cookie.expires === 'Infinity' ? null : cookie.expires,
            maxAge: cookie.maxAge,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            hostOnly: cookie.hostOnly,
            extensions: cookie.extensions
        });
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
    if (typeof callback !== FUNCTION) {
        throw new TypeError('CookieJar.get() requires a callback function');
    }

    if (typeof name !== STRING) {
        throw new TypeError('CookieJar.get() requires cookie name to be a string');
    }

    if (url && typeof url.toString === FUNCTION) {
        url = url.toString();
    }

    // @todo add CookieJar~getCookie to avoid this
    this.jar.getCookies(url, function (err, cookies) {
        var i,
            ii;

        if (err) {
            return callback(err);
        }

        if (!(cookies && cookies.length)) {
            return callback(null);
        }

        for (i = 0, ii = cookies.length; i < ii; i++) {
            if (cookies[i].key === name) {
                return callback(null, deserialize(cookies[i]));
            }
        }

        callback(null);
    });
};

PostmanCookieJar.prototype.getAll = function (url, options, callback) {
    if (typeof options === FUNCTION && !callback) {
        callback = options;
        options = {};
    }

    if (typeof callback !== FUNCTION) {
        throw new TypeError('CookieJar.getAll() requires a callback function');
    }

    if (typeof options !== OBJECT) {
        throw new TypeError('CookieJar.getAll() requires options to be an object');
    }

    if (url && typeof url.toString === FUNCTION) {
        url = url.toString();
    }

    options = {
        // return HttpOnly cookies by default
        http: options.hasOwnProperty('http') ? Boolean(options.http) : true,
        // if undefined, auto-detect from url
        secure: options.hasOwnProperty('secure') ? Boolean(options.secure) : undefined
    };

    this.jar.getCookies(url, options, function (err, cookies) {
        callback(err, cookies.map(deserialize));
    });
};

PostmanCookieJar.prototype.set = function (url, cookie, callback) {
    if (typeof cookie === OBJECT) {
        cookie = serialize(cookie);
    }

    if (!(cookie && (typeof cookie === STRING || cookie instanceof ToughCookie))) {
        throw new TypeError('CookieJar.set() requires a valid cookie instance');
    }

    if (url && typeof url.toString === FUNCTION) {
        url = url.toString();
    }

    this.jar.setCookie(cookie, url, function (err, cookie) {
        typeof callback === FUNCTION && callback(err, deserialize(cookie));
    });
};

PostmanCookieJar.prototype.unset = function (url, name, callback) {
    if (!Url.isUrl(url)) {
        url = new Url(url);
    }

    if (typeof name !== STRING) {
        throw new TypeError('CookieJar.unset() requires cookie name to be a string');
    }

    this.store.removeCookie(url.getHost(), url.path && url.getPath(), name, function (err) {
        typeof callback === FUNCTION && callback(err);
    });
};

PostmanCookieJar.prototype.clear = function (filter, callback) {
    if (typeof filter === FUNCTION && !callback) {
        callback = filter;

        this.store.removeAllCookies(function (err) {
            callback(err);
        });

        return;
    }

    if (typeof filter !== OBJECT) {
        throw new TypeError('CookieJar.clear() requires filter to be an object');
    }

    var domain,
        path,
        url = filter.url;

    if (url && !Url.isUrl(url)) {
        url = new Url(url);
    }

    domain = url && url.getHost() || filter.domain;
    path = url && url.path && url.getPath() || filter.path;

    this.store.removeCookies(domain, path, function (err) {
        typeof callback === FUNCTION && callback(err);
    });
};

module.exports = PostmanCookieJar;
