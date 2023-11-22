const path = require('path');

function readFileSync (path) {
    return `
        const parent = require('.');

        module.exports = {
            name: "${path}",
            module: module,
            sum: function (a, b) {
                return a + b;
            }
        };
    `;
}

class Module {
    /**
     * @param {string} id The identifier for the module. Typically this is the
     *   fully resolved filename.
     * @param {Module} parent The module that first required this one, or null
     *   if the current module is the entry point of the current process.
     */
    constructor (id, parent) {
        this.id = id;
        this.children = [];
        this.exports = {};
        this.filename = id;
        this.isPreloading = false;
        this.loaded = false;
        this.parent = parent;
        this.path = path.dirname(id);
        this.paths = [];
        this.require = null;
    }
}

function postmanRequire (filePath, parentModule) {
    if (filePath in postmanRequire.cache) {
        return postmanRequire.cache[filePath].exports;
    }

    const module = new Module(filePath, parentModule),
        code = readFileSync(filePath),

        // TODO: is this safe??
        wrapperFn = new Function('exports', 'require', 'module', '__filename',
            '__dirname', code),

        // wrap the require in a function that will use the current module as
        // the parent.
        //
        // TODO: This function should only allow importing from the current
        // directory files (apart from sandbox modules).
        require = function require (id) {
            this.cache = postmanRequire.cache;

            return postmanRequire(id, module);
        };

    // cache it before evaluating because circular dependencies should not call
    // it again, but rather use from the cache itself.
    postmanRequire.cache[filePath] = module;

    // the first time we call require, parentModule will not be set
    parentModule && parentModule.children.push(module);

    // TODO: is this safe??
    wrapperFn.apply(module.exports, [
        module.exports,
        require,
        module,
        filePath,
        module.path
    ]);

    module.loaded = true;

    return module.exports;
}

postmanRequire.cache = {};

module.exports = postmanRequire;
