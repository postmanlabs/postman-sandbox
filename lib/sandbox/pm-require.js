const MODULE_KEY = '__module_obj', // why not use `module`?
    MODULE_WRAPPER = [
        '(function (exports, module) {\n',
        `\n})(${MODULE_KEY}.exports, ${MODULE_KEY});`
    ];

/**
 * Cache of all files that are available to be required.
 *
 * @typedef {Record<string, { data: string }>} FileCache
 */

class PostmanRequireStore {
    /**
     * @param {FileCache} fileCache - fileCache
     */
    constructor (fileCache) {
        this.fileCache = fileCache;
    }

    /**
     * @param {string} path - path
     * @returns {string|undefined} - resolved path
     */
    getResolvedPath (path) {
        if (this.hasFile(path)) {
            return path;
        }
    }

    /**
     * @param {string} path - path
     * @returns {boolean}
     */
    hasFile (path) {
        return Boolean(this.fileCache[path]);
    }

    /**
     * @param {string} path - path
     * @returns {string|undefined}
     */
    getFileData (path) {
        return this.hasFile(path) && this.fileCache[path].data;
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
    if (!fileCache) {
        return;
    }

    const store = new PostmanRequireStore(fileCache),
        cache = {};

    /**
     * @param {string} name - name
     * @returns {any} - module
     */
    function postmanRequire (name) {
        const path = store.getResolvedPath(name);

        // Any module should not be evaluated twice, so we use it from the
        // cache. If there's a circular dependency, the partially evaluated
        // module will be returned from the cache.
        if (cache[path]) {
            // Always use the resolved path as the ID of the module. This
            // ensures that relative paths are handled correctly.
            return cache[path].exports;
        }

        /* eslint-disable-next-line one-var */
        const file = path && store.getFileData(path);

        if (!file) {
            // Error should contain the name exactly as the user specified,
            // and not the resolved path.
            throw new Error(`Cannot find module '${name}'`);
        }

        /* eslint-disable-next-line one-var */
        const moduleObj = {
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
        scope.exec(wrappedModule, true, (err) => {
            // Bubble up the error to be caught as execution error
            if (err) {
                throw err;
            }
        });

        scope.unset(MODULE_KEY);

        return moduleObj.exports;
    };

    return postmanRequire;
}

module.exports = createPostmanRequire;
