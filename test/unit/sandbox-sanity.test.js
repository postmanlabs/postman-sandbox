const Mocha = require('mocha'),
    IS_NODE = typeof window === 'undefined',
    TEST_ENV_GLOBALS = [
        ...Object.getOwnPropertyNames(Mocha),

        // Following are Mocha's properties that
        // for some reason are not enumerable
        'context',
        'xcontext',
        'specify',
        'xspecify',

        // nyc,
        '__coverage__',

        // sinon
        'sinon',

        // chai
        'expect'
    ],
    IGNORED_GLOBALS = [
        // Not required
        'BroadcastChannel',
        'FinalizationRegistry',
        'FormData',
        'Headers',
        'MessageChannel',
        'MessageEvent',
        'MessagePort',
        'Performance',
        'PerformanceEntry',
        'PerformanceMark',
        'PerformanceMeasure',
        'PerformanceObserver',
        'PerformanceObserverEntryList',
        'PerformanceResourceTiming',
        'Request',
        'Response',
        'WeakRef',
        'WebAssembly',
        'fetch',
        'global',
        'globalThis',
        'performance',
        'AsyncDisposableStack',
        'DisposableStack',
        'SuppressedError',
        'localStorage',
        'sessionStorage',
        'Storage',

        // No browser support
        'process',

        // requires node>=v19
        'CustomEvent',

        // requires node>=v21
        'navigator',

        // requires node>=22
        'Iterator',
        'Navigator',
        'WebSocket',

        // requires node>=23
        'CloseEvent',

        // requires node>=24
        'Float16Array',
        'URLPattern', // This is experimental in browser at the time of writing this test

        // requires node>=25
        'ErrorEvent'
    ];

describe('sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should create context', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.ping(function (err, ttl, packet) {
                expect(err).to.be.null;
                expect(packet).to.be.ok;
                expect(ttl).to.be.a('number').that.is.above(-1);
                done();
            });
        });
    });

    describe('invalid targets', function () {
        let context;

        function tester (input, done) {
            context.on('error', done);
            context.execute(input, function (err) {
                expect(err).to.be.ok;
                expect(err).to.have.property('message', 'sandbox: no target provided for execution');

                done();
            });
            context.removeEventListener('error', done);
        }


        before(function (done) {
            Sandbox.createContext(function (err, ctx) {
                if (err) { return done(err); }
                context = ctx;
                done();
            });
        });

        it('should not execute `null`', function (done) { tester(null, done); });
        it('should not execute `undefined`', function (done) { tester(undefined, done); });
    });

    describe('valid empty targets', function () {
        let context;

        function tester (input, done) {
            context.on('error', done);
            context.execute(input, done);
        }


        before(function (done) {
            Sandbox.createContext(function (err, ctx) {
                if (err) { return done(err); }
                context = ctx;
                done();
            });
        });

        it('should execute \'\'', function (done) { tester('', done); });
        it('should execute []', function (done) { tester([], done); });
        it('should execute [\'\']', function (done) { tester([''], done); });
        it('should not execute `{}`', function (done) { tester({}, done); });
        it('should not execute `{ script: {} }`', function (done) { tester({ script: {} }, done); });
        it('should execute { script: { exec: \'\' } }', function (done) { tester({ script: { exec: '' } }, done); });
        it('should execute { script: { exec: [] } }', function (done) { tester({ script: { exec: [] } }, done); });
        it('should execute { script: { exec: [\'\'] }}', function (done) { tester({ script: { exec: [''] } }, done); });
    });

    it('should execute a piece of code', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute('throw new Error("this will regurgitate!")', function (err) {
                expect(err).to.be.ok;
                expect(err).to.have.property('message', 'this will regurgitate!');
                done();
            });
        });
    });

    it('should execute code with top level await', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);

            ctx.execute(`
                async function main () {
                    await Promise.resolve();
                }

                await main();
            `, done);
        });
    });

    it('should have a few important globals', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                var assert = require('assert');
                assert.equal(typeof _, 'function');
                assert.equal(typeof Error, 'function');
                assert.equal(typeof console, 'object');
            `, done);
        });
    });

    it('should not have access to uvm bridge', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                var assert = require('assert');
                assert.equal(typeof bridge, 'undefined');
                assert.equal(typeof this.bridge, 'undefined');
                assert.equal(typeof Function('return this.bridge')(), 'undefined');
            `, done);
        });
    });

    it('should not be able to mutate Error.prepareStackTrace', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                var assert = require('assert');
                var fn = Error.prepareStackTrace;

                Error.prepareStackTrace = () => {};
                assert.equal(Error.prepareStackTrace, fn);

                var err = new Error('Test');
                assert.equal(err.stack.split('\\n')[0], 'Error: Test');
            `, done);
        });
    });

    it('should not have access to global properties', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                var assert = require('assert');
                var allowedGlobals = ${JSON.stringify(require('uniscope/lib/allowed-globals'))};
                var ignoredProps = [
                    'TEMPORARY', 'PERSISTENT', // DedicatedWorkerGlobalScope constants (in Browser)
                    'require', 'eval', 'console', // uniscope ignored
                ]
                var propNames = [];

                var contextObject = Function('return this;')();
                do {
                    propNames = propNames.concat(Object.getOwnPropertyNames(contextObject));
                    contextObject = Object.getPrototypeOf(contextObject);
                    // traverse until Object prototype
                    // @note since we mutated the scope already, don't check using the constructor
                    // instead, check for hasOwnProperty existence on the contextObject.
                } while (contextObject && !Object.hasOwnProperty.call(contextObject, 'hasOwnProperty'));

                // filter out the ignored properties
                propNames = propNames.filter(prop => !ignoredProps.includes(prop));

                // FIXME: why's 'SharedArrayBuffer' missing from browser's context?
                // Temporarily added to fix browser tests
                !propNames.includes('SharedArrayBuffer') && propNames.push('SharedArrayBuffer');

                // Make sure all allowed globals exists
                const context = Function('return this;')();
                for (const prop of allowedGlobals) {
                    if (prop === 'undefined' || prop === 'SharedArrayBuffer') {
                        continue;
                    }

                    assert.equal(context[prop] !== undefined, true, 'prop ' + prop + ' does not exist');
                }

                // make sure both propNames and allowedGlobals are same
                assert.equal(JSON.stringify(propNames.sort()), JSON.stringify(allowedGlobals.sort()));

                // double check using the diff
                var diff = propNames
                    .filter(x => !allowedGlobals.includes(x))
                    .concat(allowedGlobals.filter(x => !propNames.includes(x)));
                assert.equal(diff.length, 0);
            `, done);
        });
    });

    it('should accept an external execution id', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                var assert = require('assert');
                assert.equal(typeof _, 'function');
                assert.equal(typeof Error, 'function');
                assert.equal(typeof console, 'object');
            `, {
                id: 'my-test-id'
            }, function (err, execution) {
                if (err) { return done(err); }

                expect(execution).to.have.property('id', 'my-test-id');
                done();
            });
        });
    });

    it('should create context fleet using templates', function (done) {
        Sandbox.createContextFleet({
            grpc: '',
            websocket: ''
        }, {}, (err, fleet) => {
            if (err) { return done(err); }

            expect(fleet).to.be.an('object');
            expect(fleet.getContext).to.be.a('function');
            expect(fleet.disposeAll).to.be.a('function');

            done();
        });
    });

    it('should return the correct context for the given template name', function (done) {
        Sandbox.createContextFleet({
            grpc: `
                const chai = require('chai');

                class Message {
                    constructor () {
                        this.type = 'grpc-message';
                    }

                    get to() {
                        return chai.expect(this).to;
                    }
                }

                function initializeExecution () {
                    return {
                        request: {
                            type: 'grpc-request'
                        },
                        response: {
                            type: 'grpc-response'
                        },
                        message: new Message(),
                    }
                };

                function chaiPlugin (chai) {
                    const Assertion = chai.Assertion;

                    Assertion.addProperty('grpcRequest', function () {
                      this.assert(this._obj.type === 'grpc-request',
                        'expecting a gRPC request but got #{this}',
                        'not expecting a gRPC request object');
                    });

                    Assertion.addProperty('grpcResponse', function () {
                        this.assert(this._obj.type === 'grpc-response',
                          'expecting a gRPC response but got #{this}',
                          'not expecting a gRPC response object');
                      });

                    Assertion.addProperty('grpcMessage', function () {
                        this.assert(this._obj.type === 'grpc-message',
                          'expecting a gRPC message but got #{this}',
                          'not expecting a gRPC message object');
                    });
                }

                module.exports = { initializeExecution, chaiPlugin };
            `,
            websocket: ''
        }, {}, {}, (err, fleet) => {
            if (err) { return done(err); }

            fleet.getContext('grpc', (err, ctx) => {
                if (err) { return done(err); }

                ctx.on('error', done);

                ctx.on('execution.assertion', (_, assertions) => {
                    assertions.forEach((a) => {
                        expect(a.passed).to.be.true;
                    });
                });

                ctx.execute(`
                    pm.test('Should be gRPC request, response, and message', () => {
                        pm.request.to.be.grpcRequest;
                        pm.response.to.be.grpcResponse;
                        pm.message.to.be.grpcMessage;
                    });
                `, done);
            });
        });
    });

    it('should not be able to access NodeJS\'s `require`', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute('const childProcess = require("child_process");', function (err) {
                expect(err).to.be.ok;
                expect(err).to.have.property('message', 'Cannot find module \'child_process\'');
                done();
            });
        });
    });

    it('should not allow dynamic import', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                const mod = await import("child_process");
                (async () => { const mod = await import("child_process"); })();
            `, function (err) {
                expect(err).to.be.ok;

                if (IS_NODE) {
                    expect(err).to.have.property('message', 'A dynamic import callback was not specified.');
                }
                else {
                    expect(err).to.have.property('message', 'Failed to resolve module specifier \'child_process\'');
                }

                done();
            });
        });
    });

    it('should  persist overridden `require` across executions', function (done) {
        const consoleSpy = sinon.spy();

        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);
            ctx.on('console', consoleSpy);

            ctx.execute(`
                require = (...args) => {
                    if (args[0] === 'utils') {
                        return () => console.log('utils');
                    }

                    return require(...args);
                }

                require('utils')();
            `, function (err) {
                if (err) { return done(err); }

                ctx.execute('require(\'utils\')();', function (err) {
                    if (err) { return done(err); }

                    expect(consoleSpy).to.be.calledTwice;
                    expect(consoleSpy.firstCall.args[2]).to.equal('utils');
                    expect(consoleSpy.secondCall.args[2]).to.equal('utils');

                    done();
                });
            });
        });
    });

    (IS_NODE ? it : it.skip)('should have missing globals as subset of explicitly ignored globals', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            const nodeGlobals = Object.getOwnPropertyNames(this).filter((prop) => {
                return !TEST_ENV_GLOBALS.includes(prop);
            });

            ctx.execute(`
                var assert = require('assert');
                var sandboxGlobals = Object.getOwnPropertyNames(this);
                var contextObject = Function('return this;')();

                do {
                    sandboxGlobals = sandboxGlobals.concat(Object.getOwnPropertyNames(contextObject));
                    contextObject = Object.getPrototypeOf(contextObject);
                    // traverse until Object prototype
                    // @note since we mutated the scope already, don't check using the constructor
                    // instead, check for hasOwnProperty existence on the contextObject.
                } while (contextObject && !Object.hasOwnProperty.call(contextObject, 'hasOwnProperty'));

            const diffWithNode = ${JSON.stringify(nodeGlobals)}
                .filter((nodeGlobal) => !sandboxGlobals.includes(nodeGlobal))
                .sort();

            const isDiffSubsetOfIgnoredGlobals = diffWithNode
                .every((v) => ${JSON.stringify(IGNORED_GLOBALS)}.includes(v));

            assert.equal(isDiffSubsetOfIgnoredGlobals, true);
            `, done);
        });
    });

    it('should work with multiple templates', function (done) {
        const templatesMap = {
            graphql: `
                class Request {
                    constructor () {
                        this.type = 'graph-request';
                    }
                }

                class Response {
                    constructor () {
                        this.type = 'graph-response';
                    }
                }

                function initializeExecution () {
                    return {
                        request: new Request(),
                        response: new Response(),
                    }
                }

                module.exports = { initializeExecution, Request, Response };
            `,
            grpc: `
                function initializeExecution () {
                    return {
                        request: { type: 'grpc-request' },
                        response: { type: 'grpc-response' },
                        message: { type: 'grpc-message' }
                    }
                }

                module.exports = { initializeExecution };
            `
        };

        Sandbox.createContext({ template: templatesMap, disableLegacyAPIs: true }, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);

            ctx.on('execution.assertion', (_, assertions) => {
                assertions.forEach((a) => {
                    expect(a.passed).to.be.true;
                });
            });

            ctx.execute({
                listen: 'graphql:beforeQuery',
                script: {
                    type: 'text/javascript',
                    exec: `
                        pm.test('Should be graphQL request and response', () => {
                            pm.expect(pm.request.type).to.be.eql('graph-request');
                            pm.expect(pm.response.type).to.be.eql('graph-response');
                        });
                    `
                }
            },
            function (err) {
                if (err) { return done(err); }

                ctx.execute({
                    listen: 'grpc:beforeInvoke',
                    script: {
                        type: 'text/javascript',
                        exec: `
                            pm.test('Should be graphQL request and response', () => {
                                pm.expect(pm.request.type).to.be.eql('grpc-request');
                                pm.expect(pm.response.type).to.be.eql('grpc-response');
                                pm.expect(pm.message.type).to.be.eql('grpc-message');
                            });
                        `
                    }
                },
                function (err) {
                    done(err);
                });
            });
        });
    });

    it('should work with multiple templates and an included chai plugin', function (done) {
        const templatesMap = {
            grpc: `
                function initializeExecution () {
                    return {
                        request: { type: 'grpc-request' },
                        response: { type: 'grpc-response' }
                    }
                }

                function chaiPlugin (chai) {
                    const Assertion = chai.Assertion;

                    Assertion.addProperty('grpcResponse', function () {
                        this.assert(this._obj.type === 'grpc-response',
                            'expecting a postman request object but got #{this}',
                            'not expecting a postman request object');
                    });
                }

                module.exports = { initializeExecution, chaiPlugin };
            `
        };

        Sandbox.createContext({ template: templatesMap, disableLegacyAPIs: true }, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);

            ctx.on('execution.assertion', (_, assertions) => {
                assertions.forEach((a) => {
                    expect(a.passed).to.be.true;
                });
            });

            ctx.execute({
                listen: 'grpc:beforeInvoke',
                script: {
                    type: 'text/javascript',
                    exec: `
                        pm.test('Should be gRPC response', () => {
                            pm.expect(pm.response).to.be.grpcResponse;
                        });
                    `
                }
            },
            function (err) {
                done(err);
            });
        });
    });

    it('should work with multiple templates and a separately passed chai plugin', function (done) {
        const templatesMap = {
                grpc: `
                    function initializeExecution () {
                        return {
                            request: { type: 'grpc-request' },
                            response: { type: 'grpc-response' }
                        }
                    }

                    module.exports = {
                        initializeExecution,
                        requestType: 'grpc-request',
                        responseType: 'grpc-response'
                    };
                `
            },
            chaiPlugin = `
            function chaiPluginGenerator (templates) {
                return function chaiPlugin (chai) {
                    const Assertion = chai.Assertion;

                    Assertion.addProperty('grpcRequest', function () {
                        this.assert(this._obj.type === templates.grpc.requestType,
                            'expecting a postman request object but got #{this}',
                            'not expecting a postman request object');
                    });

                    Assertion.addProperty('grpcResponse', function () {
                        this.assert(this._obj.type === templates.grpc.responseType,
                            'expecting a postman response object but got #{this}',
                            'not expecting a postman response object');
                    });
                }
            }

            module.exports = chaiPluginGenerator;
        `;

        Sandbox.createContext({
            template: templatesMap,
            chaiPlugin: chaiPlugin,
            disableLegacyAPIs: true
        }, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);

            ctx.on('execution.assertion', (_, assertions) => {
                assertions.forEach((a) => {
                    expect(a.passed).to.be.true;
                });
            });

            ctx.execute({
                listen: 'grpc:afterResponse',
                script: {
                    type: 'text/javascript',
                    exec: `
                        pm.test('Should assert gRPC request and response', () => {
                            pm.expect(pm.request).to.be.grpcRequest;
                            pm.expect(pm.request).not.to.be.grpcResponse;
                        });
                    `
                }
            },
            function (err) {
                done(err);
            });
        });
    });
});
