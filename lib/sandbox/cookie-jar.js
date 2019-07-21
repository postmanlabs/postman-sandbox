var CookieJar = require('tough-cookie').CookieJar,
    ToughCookie = require('tough-cookie').Cookie,
    PostmanCookie = require('postman-collection').Cookie,
    PostmanCookieList = require('postman-collection').CookieList,
    Url = require('postman-collection').Url,

    FUNCTION = 'function',
    OBJECT = 'object',
    STRING = 'string',

    // PostmanCookie to ToughCookie
    serialize = function (cookie) {
        if (!cookie) {
            return;
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
        if (!cookie) {
            return;
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

    sanitizeURL = function (url) {
        if (Url.isUrl(url)) {
            return url;
        }

        if (url && typeof url === STRING) {
            return new Url(url);
        }

        return null;
    },

    callbackHandler = function (callback, err, result) {
        if (typeof callback !== FUNCTION) {
            return;
        }

        if (err) {
            return callback(err instanceof Error ? err : new Error(err));
        }

        callback(null, result);
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
    url = sanitizeURL(url);

    if (!url) {
        throw new TypeError('CookieJar.get() requires a valid url');
    }

    if (typeof callback !== FUNCTION) {
        throw new TypeError('CookieJar.get() requires a callback function');
    }

    if (typeof name !== STRING) {
        throw new TypeError('CookieJar.get() requires cookie name to be a string');
    }

    // @todo add CookieJar~getCookie to avoid this
    this.jar.getCookies(url.toString(true), function (err, cookies) {
        var i,
            ii,
            cookie;

        if (err) {
            return callbackHandler(callback, err);
        }

        if (!(cookies && cookies.length)) {
            return callbackHandler(callback, null, null);
        }

        for (i = 0, ii = cookies.length; i < ii; i++) {
            if (cookies[i].key === name) {
                cookie = deserialize(cookies[i]);
                return callbackHandler(callback, null, cookie && cookie.valueOf());
            }
        }

        callbackHandler(callback, null, null);
    });
};

PostmanCookieJar.prototype.getAll = function (url, options, callback) {
    url = sanitizeURL(url);

    if (!url) {
        throw new TypeError('CookieJar.getAll() requires a valid url');
    }

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

    options = {
        // return HttpOnly cookies by default
        http: options.hasOwnProperty('http') ? Boolean(options.http) : true,
        // if undefined, auto-detect from url
        secure: options.hasOwnProperty('secure') ? Boolean(options.secure) : undefined
    };

    this.jar.getCookies(url.toString(true), options, function (err, cookies) {
        if (err) {
            return callbackHandler(callback, err);
        }

        callbackHandler(callback, null, new PostmanCookieList(null, cookies.map(deserialize)));
    });
};

PostmanCookieJar.prototype.set = function (url, name, value, callback) {
    url = sanitizeURL(url);

    if (!url) {
        throw new TypeError('CookieJar.set() requires a valid url');
    }

    if (typeof value === FUNCTION && !callback) {
        callback = value;
        value = null;
    }

    var cookie;

    // @todo avoid else-if to reduce cyclomatic complexity
    if (name && value) {
        cookie = serialize({name: name, value: value});
    }
    else if (typeof name === OBJECT) {
        cookie = serialize(name);
    }
    else if (typeof name === STRING) {
        cookie = name;
    }
    else {
        throw new TypeError('CookieJar.set() requires a valid set cookie arguments');
    }

    if (typeof url.toString === FUNCTION) {
        url = url.toString();
    }

    this.jar.setCookie(cookie, url.toString(true), function (err, cookie) {
        if (err) {
            return callbackHandler(callback, err);
        }

        callbackHandler(callback, null, deserialize(cookie));
    });
};

PostmanCookieJar.prototype.unset = function (url, name, callback) {
    url = sanitizeURL(url);

    if (!url) {
        throw new TypeError('CookieJar.unset() requires a valid url');
    }

    if (typeof name !== STRING) {
        throw new TypeError('CookieJar.unset() requires cookie name to be a string');
    }

    this.store.removeCookie(url.getHost(), url.path && url.getPath(), name, function (err) {
        callbackHandler(callback, err);
    });
};

PostmanCookieJar.prototype.clear = function (url, callback) {
    url = sanitizeURL(url);

    if (!url) {
        throw new TypeError('CookieJar.clear() requires a valid url');
    }

    this.store.removeCookies(url.getHost(), url.path && url.getPath(), function (err) {
        callbackHandler(callback, err);
    });
};

module.exports = PostmanCookieJar;
