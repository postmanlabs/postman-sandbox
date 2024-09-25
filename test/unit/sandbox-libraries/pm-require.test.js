describe('sandbox library - pm.require api', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),

        sampleContextData = {
            globals: [{
                key: 'var1',
                value: 'one'
            }, {
                key: 'var2',
                value: 2,
                type: 'number'
            }],
            environment: [{
                key: 'var1',
                value: 'one-env'
            }, {
                key: 'var2',
                value: 2.5,
                type: 'number'
            }],
            collectionVariables: [{
                key: 'var1',
                value: 'collection-var1',
                type: 'string'
            }, {
                key: 'var2',
                value: 2.9,
                type: 'number'
            }],
            data: {
                var1: 'one-data'
            }
        },
        context;

    beforeEach(function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('should be an exposed function', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual((typeof pm.require), 'function');
        `, {
            context: sampleContextData,
            resolvedPackages: {}
        }, done);
    });

    it('should not be a function if resolvedPackages is not present', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual((typeof pm.require), 'undefined');
        `, {
            context: sampleContextData
        }, done);
    });

    it('should return the exports from the file', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod = pm.require('mod1');
            assert.strictEqual(mod.a, 123);
            assert.strictEqual(mod.b, 456);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: 'module.exports = { a: 123, b: 456 }'
                }
            }
        }, done);
    });

    it('should throw error if required file is not found', function (done) {
        context.execute(`
            var assert = require('assert');
            try {
                pm.require('mod1');
            }
            catch (e) {
                assert.strictEqual(e.message, "Cannot find package 'mod1'");
            }
        `, {
            context: sampleContextData,
            resolvedPackages: {}
        }, done);
    });

    it('should throw custom error if required file has error', function (done) {
        context.execute(`
            var assert = require('assert');
            try {
                pm.require('mod1');
                throw new Error('should not reach here');
            }
            catch (e) {
                assert.strictEqual(e.message, "Error while loading package 'mod1': my error");
            }
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    error: 'my error'
                }
            }
        }, done);
    });

    it('should throw error if required file throws error', function (done) {
        context.execute(`
            var assert = require('assert');
            try {
                pm.require('mod1');
                throw new Error('expected to throw');
            }
            catch (e) {
                assert.strictEqual(e.message, "Error in package 'mod1': my error");
            }
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    name: 'mod1',
                    data: 'throw new Error("my error");'
                }
            }
        }, done);
    });

    it('should not throw error if file is empty', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod = pm.require('mod1');
            assert.deepEqual(mod, {});
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: ''
                }
            }
        }, done);
    });

    it('should allow required files to access globals', function (done) {
        context.execute(`
            var assert = require('assert');
            var1 = 123; // global
            var mod = pm.require('mod1');
            assert.strictEqual(mod.a, 123);
            assert.strictEqual(mod.b, 456);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        var2 = 456;
                        module.exports = { a: var1, b: pm.require('mod2') };
                    `
                },
                mod2: {
                    data: `
                        module.exports = var2;
                    `
                }
            }
        }, done);
    });

    it('should allow setting globals from required files', function (done) {
        context.execute(`
            var assert = require('assert');
            pm.require('mod1');
            assert.strictEqual(var1, 123);
            assert.strictEqual(var2, 456);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        var1 = 123;
                        var2 = 456;
                    `
                }
            }
        }, done);
    });

    it('should allow required files to access pm.* apis', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod = pm.require('mod1');
            assert.strictEqual(mod.a, "one-env");
            assert.strictEqual(mod.b, 2);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports = {
                            a: pm.environment.get("var1"),
                            b: pm.globals.get("var2")
                        };
                    `
                }
            }
        }, done);
    });

    it('should allow required files to require other files', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod = pm.require('mod1');
            assert.strictEqual(mod.a, 123);
            assert.strictEqual(mod.b, 345);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports = {
                            a: 123,
                            b: pm.require("mod2")
                        }
                    `
                },
                mod2: {
                    data: `
                        module.exports = 345;
                    `
                }
            }
        }, done);
    });

    it('should not evaluate the same file twice', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod1 = pm.require('mod1');
            var mod2 = pm.require('mod1');
            assert.strictEqual(mod1, mod2);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports = { a: 123 };
                    `
                }
            }
        }, done);
    });

    it('should allow circular dependencies', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod1 = pm.require('mod1');
            assert.strictEqual(mod1.a, 123);
            assert.strictEqual(mod1.b, 123);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports.a = 123;
                        module.exports.b = pm.require("mod2");
                    `
                },
                mod2: {
                    data: `
                        module.exports = pm.require("mod1").a;
                    `
                }
            }
        }, done);
    });

    it('should allow required file to require itself', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod1 = pm.require('mod1');
            assert.strictEqual(mod1.a, 123);
            assert.strictEqual(mod1.b, 123);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports.a = 123;
                        module.exports.b = pm.require("mod1").a;
                    `
                }
            }
        }, done);
    });

    // TODO: fixit
    it.skip('should not have access to __module_obj', function (done) {
        context.execute(`
            var assert = require('assert');
            try {
                const val = pm.require('mod1');
                throw new Error('should not reach here');
            }
            catch (e) {
                assert.strictEqual(e.message, "__module_obj is not defined");
            }
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports = __module_obj; // __module_obj should not be defined
                    `
                }
            }
        }, done);
    });

    it('should allow async operations', function (done) {
        const errorSpy = sinon.stub();

        context.on('execution.error', errorSpy);
        context.execute(`
            const assert = require('assert');
            const mod1 = pm.require('mod1');

            assert.strictEqual(mod1.a, 123);
            assert.strictEqual(mod1.b, undefined); // should not be updated yet

            setTimeout(() => {
                assert.strictEqual(mod1.a, 123);
                assert.strictEqual(mod1.b, 456);
            }, 10);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports.a = 123;
                        setTimeout(function () {
                            module.exports.b = 456;
                        }, 10);
                    `
                }
            }
        }, function (err) {
            if (err) {
                return done(err);
            }

            expect(errorSpy, 'there was an error in the script').to.not.have.been.called;
            done();
        });
    });

    it('should catch errors in async code', function (done) {
        const errorSpy = sinon.stub();

        context.on('execution.error', errorSpy);
        context.execute(`
            pm.require('mod1');
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        setTimeout(function () {
                            pm.require('mod2');
                        }, 10);
                    `
                },
                mod2: {
                    data: `
                        setTimeout(function () {
                            throw new Error('my async error');
                        }, 10);
                    `
                }
            }
        }, function (err) {
            if (err) {
                return done(err);
            }

            expect(errorSpy, 'there was no error in the script').to.have.been.calledOnce;
            expect(errorSpy.firstCall.args[1]).to.have.property('message', 'my async error');
            done();
        });
    });

    it('should keep the references for the locals instead of values', function (done) {
        const errorSpy = sinon.stub();

        context.on('execution.error', errorSpy);
        context.execute(`
            const assert = require('assert');

            a = 1;
            b = 1;
            obj = {
                a: 1,
                b: 1
            };

            pm.require('mod1');
            pm.require('mod2');

            assert(a === 2);
            assert(obj.a === 2);

            setTimeout(function () {
                assert(b === 2);
                assert(obj.b === 2);
            }, 3);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        const assert = require('assert');

                        assert(a === 1);
                        assert(obj.a === 1);

                        a = 2;
                        obj.a = 2;

                        setTimeout(function () {
                            assert(b === 1);
                            assert(obj.b === 1);

                            b = 2;
                            obj.b = 2;
                        }, 1);
                    `
                },
                mod2: {
                    data: `
                        const assert = require('assert');

                        assert.strictEqual(obj.a, 2, 'sync variables by reference not updated');
                        assert.strictEqual(a, 2, 'sync variables by value not updated');

                        setTimeout(function () {
                            assert.strictEqual(obj.b, 2, 'async variables by reference not updated');
                            assert.strictEqual(b, 2, 'async variables by value not updated');
                        }, 2);
                    `
                }
            }
        }, function (err) {
            if (err) {
                return done(err);
            }

            expect(errorSpy).to.not.have.been.called;
            done();
        });
    });

    it('should make "module" available in the required file', function (done) {
        context.execute(`
            pm.require('mod1');
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        var assert = require('assert');
                        assert.ok(module);
                        assert.ok(module.exports);
                        assert.strictEqual(module.exports, exports);
                        assert.strictEqual(module.id, 'mod1');
                    `
                }
            }
        }, done);
    });

    it('should not have access to cache', function (done) {
        context.execute(`
            var assert = require('assert');
            var mod1 = pm.require('mod1');

            assert.strictEqual(pm.require.cache, undefined);
        `, {
            context: sampleContextData,
            resolvedPackages: {
                mod1: {
                    data: `
                        module.exports = { a: 123 };
                    `
                }
            }
        }, done);
    });

    it('should not have access to legacy postman global', function (done) {
        const errorSpy = sinon.stub();

        context.on('execution.error', errorSpy);
        context.execute(`
            pm.require('sync_usage');
            pm.require('func_usage');
            pm.require('async_usage');
            setTimeout(() => {}, 20); // wait for async code to finish
        `, {
            context: sampleContextData,
            resolvedPackages: {
                sync_usage: {
                    data: ['var assert = require(\'assert\');'].concat([
                        'tests',
                        'globals',
                        'environment',
                        'data',
                        'request',
                        'responseCookies',
                        'responseHeaders',
                        'responseTime',
                        'responseCode',
                        'responseBody',
                        'iteration',
                        'postman',

                        // scope libraries
                        '_',
                        'CryptoJS',
                        'tv4',
                        'xml2Json',
                        'Backbone',
                        'cheerio'
                    ].map(function (key) {
                        return `assert.strictEqual(${key}, undefined);`;
                    })).join('\n')
                },
                func_usage: {
                    data: `
                        var assert = require('assert');
                        try {
                            Function('return postman')();
                            throw new Error('should not reach here');
                        } catch (e) {
                            assert.strictEqual(e.message, 'postman is not defined');
                        }
                    `
                },
                async_usage: {
                    data: `
                        var assert = require('assert');
                        setTimeout(function () {
                            assert.strictEqual(postman, undefined);
                        }, 10);
                    `
                }
            }
        }, function (err) {
            if (err) {
                return done(err);
            }

            expect(errorSpy).to.not.have.been.called;
            done();
        });
    });
});
