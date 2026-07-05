const { LEGACY_GLOBS } = require('./postman-legacy-interface'),

    MODULE_KEY = '__module_obj', // why not use `module`?
    MODULE_WRAPPER = [
        '((exports, module) => {\n',
        `\n})(${MODULE_KEY}.exports, ${MODULE_KEY});`
    ],
    // Matches a leading `registry:` prefix followed by a package specifier.
    // The specifier may itself contain colons (e.g. `npm:pkg:subpath`), so we
    // only anchor on the registry segment and allow anything after the first
    // colon. Anchoring both ends keeps the classification total.
    PACKAGE_TYPE_REGEX = /^[^:]+:.+$/,

    // This is used to determine if the package is external or internal.
    // External packages are those that are not part of the Postman's
    // Package Library and follow the format `registry:package`.
    isExternalPackage = (name) => { return PACKAGE_TYPE_REGEX.test(name); };

/**
 * Cache of all files that are available to be required.
 *
 * @typedef {Object.<string, { data: string } | { error: string }>} FileCache
 */

class PostmanRequireStore {
    /**
     * @param {FileCache} fileCache - fileCache
     */
    constructor (fileCache) {
        if (!fileCache) {
            throw new Error('File cache is required');
        }

        this.fileCache = fileCache;
    }

    /**
     * Check if the file is available in the cache.
     *
     * @param {string} path - path
     * @returns {boolean}
     */
    hasFile (path) {
        return Boolean(this.getFile(path));
    }

    /**
     * Get the file from the cache.
     *
     * @param {string} path - path
     * @returns {Object|undefined} - file
     */
    getFile (path) {
        return this.fileCache[path];
    }

    /**
     * Get the resolved path for the file.
     *
     * @param {string} path - path
     * @returns {string|undefined} - resolved path
     */
    getResolvedPath (path) {
        if (this.hasFile(path)) {
            return path;
        }
    }

    /**
     * Get the file data.
     *
     * @param {string} path - path
     * @returns {string|undefined}
     */
    getFileData (path) {
        return this.hasFile(path) && this.getFile(path).data;
    }

    /**
     * Check if the file has an error.
     *
     * @param {string} path - path
     * @returns {boolean}
     */
    hasError (path) {
        return this.hasFile(path) && Boolean(this.getFile(path).error);
    }

    /**
     * Get the file error.
     *
     * @param {string} path - path
     * @returns {string|undefined}
     */
    getFileError (path) {
        return this.hasError(path) && this.getFile(path).error;
    }
}

/**
 * @param {FileCache} fileCache - fileCache
 * @param {Object} scope - scope
 * @returns {Function} - postmanRequire
 * @example
 *  const fileCache = {
 *      'path/to/file.js': {
 *          data: 'module.exports = { foo: "bar" };'
 *      }
 *  };
 *
 *  const postmanRequire = createPostmanRequire(fileCache, scope);
 *
 *  const module = postmanRequire('path/to/file.js');
 *  console.log(module.foo); // bar
 */
function createPostmanRequire (fileCache, scope) {
    const store = new PostmanRequireStore(fileCache || {}),
        cache = {};

    /**
     * @param {string} name - name
     * @returns {any} - module
     */
    function postmanRequire (name) {
        // Coerce the requested name to a string exactly once. A caller-supplied
        // object with a stateful `toString()` could otherwise return different
        // values across the multiple coercions below, letting the external
        // classification disagree with the package that actually gets loaded
        // (and poisoning the cache under an attacker-influenced key).
        const canonicalName = String(name),
            path = store.getResolvedPath(canonicalName);

        if (!path) {
            // Error should contain the name exactly as the user specified,
            // and not the resolved path.
            throw new Error(`Cannot find package '${canonicalName}'`);
        }

        if (store.hasError(path)) {
            throw new Error(`Error while loading package '${canonicalName}': ${store.getFileError(path)}`);
        }

        // Any module should not be evaluated twice, so we use it from the
        // cache. If there's a circular dependency, the partially evaluated
        // module will be returned from the cache.
        if (cache[path]) {
            // Always use the resolved path as the ID of the module. This
            // ensures that relative paths are handled correctly.
            return cache[path].exports;
        }

        /* eslint-disable-next-line one-var */
        const file = store.getFileData(path),
            moduleObj = {
                id: path,
                exports: {}
            };

        // Add to cache before executing. This ensures that any dependency
        // that tries to import it's parent/ancestor gets the cached
        // version and not end up in infinite loop.
        cache[moduleObj.id] = moduleObj;

        /* eslint-disable-next-line one-var */
        const wrappedModule = MODULE_WRAPPER[0] + file + MODULE_WRAPPER[1];

        scope.import({
            [MODULE_KEY]: moduleObj
        });

        // Note: We're executing the code in the same scope as the one
        // which called the `pm.require` function. This is because we want
        // to share the global scope across all the required modules. Any
        // locals are available inside the required modules and any locals
        // created inside the required modules are available to the parent.
        //
        // Why `async` = true?
        //   - We want to allow execution of async code like setTimeout etc.
        scope.exec(wrappedModule, {
            async: true,
            block: isExternalPackage(canonicalName) ?
                LEGACY_GLOBS.concat('pm') :
                LEGACY_GLOBS
        }, (err) => {
            // Bubble up the error to be caught as execution error
            if (err) {
                throw new Error(`Error in package '${canonicalName}': ${err.message ? err.message : err}`);
            }
        });

        scope.unset(MODULE_KEY);

        return moduleObj.exports;
    }

    return postmanRequire;
}

module.exports = createPostmanRequire;
