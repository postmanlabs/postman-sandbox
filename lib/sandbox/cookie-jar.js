const CookieJar = require('@postman/tough-cookie').CookieJar,
    ToughCookie = require('@postman/tough-cookie').Cookie,
    PostmanCookie = require('postman-collection').Cookie,
    PostmanCookieList = require('postman-collection').CookieList,
    Url = require('postman-collection').Url,

    FUNCTION = 'function',
    OBJECT = 'object',
    STRING = 'string',

    /**
     * Convert PostmanCookie Cookie instance to ToughCookie instance.
     *
     * @private
     * @param {PostmanCookie} cookie - Postman Cookie instance
     * @returns {ToughCookie} Tough Cookie instance
     */
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

    /**
     * Convert Tough Cookie instance to Electron Cookie instance.
     *
     * @private
     * @param {ToughCookie} cookie - Tough Cookie instance
     * @returns {ElectronCookie} Electron Cookie instance
     */
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

    /**
     * Sanitize url object or string to Postman URL instance.
     *
     * @private
     * @param {Object|String} url -
     * @returns {Url|Null}
     */
    sanitizeURL = function (url) {
        if (Url.isUrl(url)) {
            return url;
        }

        if (url && typeof url === STRING) {
            return new Url(url);
        }

        return null;
    },

    /**
     * Executes a provided function once for each array element.
     *
     * @note not completely asynchronous, don't compare with async.each
     *
     * @private
     * @param {Array} items - Array of items to iterate over
     * @param {Function} fn - An async function to apply to each item in items
     * @param {Function} cb - A callback which is called when all iteratee functions have finished,
     * or an error occurs
     */
    forEachWithCallback = function (items, fn, cb) {
        !cb && (cb = function () { /* (ಠ_ಠ) */ });

        if (!(Array.isArray(items) && fn)) { return cb(); }

        var index = 0,
            totalItems = items.length,
            next = function (err) {
                if (err || index >= totalItems) {
                    return cb(err);
                }

                try {
                    fn.call(items, items[index++], next);
                }
                catch (error) {
                    return cb(error);
                }
            };

        if (!totalItems) {
            return cb();
        }

        next();
    },

    /**
     * Helper function to handle callback.
     *
     * @private
     * @param {Function} callback - Callback function
     * @param {Error|String} err - Error or Error message
     * @param {*} result -
     */
    callbackHandler = function (callback, err, result) {
        if (typeof callback !== FUNCTION) {
            return;
        }

        if (err) {
            return callback(err instanceof Error ? err : new Error(err));
        }

        callback(null, result);
    },

    dualModeFunction = function (fn, callback, isCallbackRequired) {
        const handler = () => {
            return new Promise((resolve, reject) => {
                fn(function (err, result) {
                    if (err) {
                        return reject(err instanceof Error ? err : new Error(err));
                    }

                    resolve(result);
                });
            });
        };

        if (callback === undefined) {
            return handler();
        }

        if (typeof callback !== FUNCTION && isCallbackRequired) {
            throw new TypeError('callback needs to be a function');
        }

        handler().then((result) => {
            callbackHandler(callback, null, result);
        }).catch((err) => {
            callbackHandler(callback, err);
        });
    },

    /**
     * Helper function to fetch a cookie with given name.
     *
     * @private
     * @todo add CookieJar~getCookie to avoid this
     *
     * @param {CookieJar} jar - ToughCookie jar instance
     * @param {String} url - URL string
     * @param {String} name - Cookie name
     * @param {Function} callback - Callback function
     */
    getCookie = function (jar, url, name, callback) {
        jar.getCookies(url, function (err, cookies) {
            var i,
                ii;

            if (err) {
                return callback(err);
            }

            if (!(cookies && cookies.length)) {
                return callback(null, null);
            }

            for (i = 0, ii = cookies.length; i < ii; i++) {
                if (cookies[i].key === name) {
                    return callback(null, cookies[i]);
                }
            }

            callback(null, null);
        });
    };

class PostmanCookieJar {
    /**
     * @param {Object} cookieStore - Cookie store instance
     */
    constructor (cookieStore) {
        this.store = cookieStore;
        this.jar = new CookieJar(cookieStore, {
            rejectPublicSuffixes: false,
            looseMode: true
        });
    }

    /**
     * Get the cookie value with the given name.
     *
     * @param {String} url - URL string
     * @param {String} name - Cookie name
     * @param {Function} [callback] - Callback function
     * @returns {Promise|undefined} - Returns a promise if callback is not provided
     */
    get (url, name, callback) {
        return dualModeFunction((cb) => {
            url = sanitizeURL(url);

            if (!url) {
                throw new TypeError('CookieJar.get() requires a valid url');
            }

            if (typeof name !== STRING) {
                throw new TypeError('CookieJar.get() requires cookie name to be a string');
            }

            getCookie(this.jar, url.toString(true), name, function (err, cookie) {
                if (err || !cookie) {
                    return cb(err, null);
                }

                cookie = deserialize(cookie);

                return cb(null, cookie.valueOf());
            });
        }, callback, true);
    }

    /**
     * Get all the cookies for the given URL.
     *
     * @param {String} url - URL string
     * @param {Object} [options] - Options object
     * @param {Boolean} [options.http] - Include only HttpOnly cookies
     * @param {Boolean} [options.secure] - Include Secure cookies
     * @param {Function} [callback] - Callback function
     * @returns {Promise|undefined} - Returns a promise if callback is not provided
     */
    getAll (url, options, callback) {
        if (typeof options === FUNCTION && !callback) {
            callback = options;
            options = {};
        }

        if (options === undefined && !callback) {
            options = {};
        }

        return dualModeFunction((cb) => {
            url = sanitizeURL(url);

            if (!url) {
                throw new TypeError('CookieJar.getAll() requires a valid url');
            }

            if (typeof options !== OBJECT) {
                throw new TypeError('CookieJar.getAll() requires options to be an object');
            }

            options = {
                // return HttpOnly cookies by default
                http: Object.hasOwn(options, 'http') ? Boolean(options.http) : true,
                // if undefined, auto-detect from url
                secure: Object.hasOwn(options, 'secure') ? Boolean(options.secure) : undefined
            };

            this.jar.getCookies(url.toString(true), options, function (err, cookies) {
                if (err) {
                    return cb(err);
                }

                cb(null, new PostmanCookieList(null, cookies && cookies.map(deserialize)));
            });
        }, callback, true);
    }

    /**
     * Set or update a cookie.
     *
     * @param {String} url - URL string
     * @param {String|Object} name - Cookie name
     * @param {String|Function} [value] - Cookie value
     * @param {Function} [callback] - Callback function
     * @returns {Promise|undefined} - Returns a promise if callback is not provided
     */
    set (url, name, value, callback) {
        if (typeof value === FUNCTION && !callback) {
            callback = value;
            value = null;
        }

        return dualModeFunction((cb) => {
            url = sanitizeURL(url);

            if (!url) {
                throw new TypeError('CookieJar.set() requires a valid url');
            }

            var cookie;

            // @todo avoid else-if to reduce cyclomatic complexity
            if (name && value) {
                cookie = serialize({ name, value });
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

            this.jar.setCookie(cookie, url.toString(true), function (err, cookie) {
                if (err) {
                    return cb(err);
                }

                cb(null, deserialize(cookie));
            });
        }, callback);
    }

    /**
     * Remove single cookie with the given name.
     *
     * @param {String} url - URL string
     * @param {String} name - Cookie name
     * @param {Function} [callback] - Callback function
     * @returns {Promise|undefined} - Returns a promise if callback is not provided
     */
    unset (url, name, callback) {
        return dualModeFunction((cb) => {
            url = sanitizeURL(url);

            if (!url) {
                throw new TypeError('CookieJar.unset() requires a valid url');
            }

            if (typeof name !== STRING) {
                throw new TypeError('CookieJar.unset() requires cookie name to be a string');
            }

            var store = this.store;

            getCookie(this.jar, url.toString(true), name, function (err, cookie) {
                if (err || !cookie) {
                    return cb(err);
                }

                store.removeCookie(cookie.domain, cookie.path, cookie.key, function (err) {
                    cb(err);
                });
            });
        }, callback);
    }

    /**
     * Remove all the cookies for the given URL.
     *
     * @param {String} url - URL string
     * @param {Function} [callback] - Callback function
     * @returns {Promise|undefined} - Returns a promise if callback is not provided
     */
    clear (url, callback) {
        return dualModeFunction((cb) => {
            url = sanitizeURL(url);

            if (!url) {
                throw new TypeError('CookieJar.clear() requires a valid url');
            }

            var store = this.store;

            this.jar.getCookies(url.toString(true), function (err, cookies) {
                if (err || !cookies) {
                    return cb(err);
                }

                forEachWithCallback(cookies, function (cookie, next) {
                    store.removeCookie(cookie.domain, cookie.path, cookie.key, next);
                }, cb);
            });
        }, callback);
    }
}

module.exports = PostmanCookieJar;
