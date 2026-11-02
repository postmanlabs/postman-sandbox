describe('sandbox library - legacy', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        context;

    beforeEach(function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('should not show a warning if no legacy vars used', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
            pm.iterationData.get('foo');
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.not.be.called;
            done();
        });
    });

    it('should show warning on using legacy vars', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
            data['foo'] = 'bar';
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledOnce;
            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "data" is deprecated. Use "pm.iterationData" instead.');
            done();
        });
    });

    it('should show a warning on using legacy functions', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
           cheerio.load('foo');
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledOnce;
            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "cheerio" is deprecated. Use "require(\'cheerio\')" instead.');
            done();
        });
    });

    it('should show a single warning per execution for each global', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
            data['foo'] = 'bar1';
            data['foo'] = 'bar2';
            environment['foo'] = 'bar';
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledTwice;
            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "data" is deprecated. Use "pm.iterationData" instead.');

            expect(consoleSpy.secondCall.args[1]).to.equal('warn');
            expect(consoleSpy.secondCall.args[2])
                .to.equal('Using "environment" is deprecated. Use "pm.environment" instead.');
            done();
        });
    });

    it('should have special handling for postman.*', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
            postman.setNextRequest('abc');
            postman.setEnvironmentVariable('foo', 'bar');
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledTwice;
            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "postman.setNextRequest" is deprecated. Use "pm.execution.setNextRequest()" instead.');
            expect(consoleSpy.secondCall.args[1]).to.equal('warn');
            expect(consoleSpy.secondCall.args[2])
                .to.equal('Using "postman.setEnvironmentVariable" is deprecated. Use "pm.environment.set()" instead.');
            done();
        });
    });

    it('should support "responseBody" with size upto 50MB', function (done) {
        context.execute({
            listen: 'test',
            script: `
                const assert = require('assert');
                assert.strictEqual(
                    responseBody,
                    Buffer.alloc(50 * 1024 * 1024, 'a').toString(),
                    'responseBody <= 50MB should be available'
                );
            `
        }, {
            context: {
                response: {
                    stream: {
                        type: 'Base64',
                        data: Buffer.alloc(50 * 1024 * 1024, 'a').toString('base64')
                    }
                }
            }
        }, done);
    });

    it('should truncate "responseBody" with size > 50MB', function (done) {
        context.execute({
            listen: 'test',
            script: `
                const assert = require('assert');
                assert.strictEqual(typeof responseBody, 'undefined', 'responseBody > 50MB should not be available');
            `
        }, {
            context: {
                response: {
                    stream: {
                        type: 'Base64',
                        data: Buffer.alloc(51 * 1024 * 1024, 'a').toString('base64')
                    }
                }
            }
        }, done);
    });
});

describe('sandbox library - legacy - skipUnusedResponseBody', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        legacy = require('../../../lib/sandbox/postman-legacy-interface'),
        body = 'a'.repeat(1024),
        responseContext = {
            context: {
                response: { stream: { type: 'Base64', data: Buffer.from(body).toString('base64') } }
            }
        },
        context;

    beforeEach(function (done) {
        Sandbox.createContext({ skipUnusedResponseBody: true }, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('should still provide "responseBody" to scripts that name it', function (done) {
        context.execute({
            listen: 'test',
            script: `
                const assert = require('assert');
                assert.strictEqual(responseBody, '${body}');
            `
        }, responseContext, done);
    });

    it('should still provide "responseBody" to scripts that build its name at runtime', function (done) {
        context.execute({
            listen: 'test',
            script: `
                const assert = require('assert'),
                    name = 'respon' + 'seBody';
                assert.strictEqual(this[name], '${body}');
                assert.strictEqual(eval(name), '${body}');
            `
        }, responseContext, done);
    });

    it('should keep pm.response and other legacy globals for scripts that skip it', function (done) {
        const assertions = [];

        context.on('execution.assertion', (_, list) => { assertions.push(...list); });
        context.execute({
            listen: 'test',
            script: `
                tests['status code is set'] = typeof responseCode === 'object';
                pm.test('body is readable', () => pm.expect(pm.response.text()).to.have.lengthOf(1024));
            `
        }, responseContext, function (err) {
            if (err) { return done(err); }

            expect(assertions.map((a) => { return [a.name, a.passed]; })).to.have.deep.members([
                ['body is readable', true],
                ['status code is set', true]
            ]);
            done();
        });
    });

    describe('option wiring', function () {
        var executePath = require.resolve('../../../lib/sandbox/execute'),
            executeContextPath = require.resolve('../../../lib/sandbox/execute-context'),
            executeContext,
            bridge;

        // boots the sandbox's execute handler on a fake bridge, with execute-context stubbed to capture its options
        function boot (initOptions) {
            executeContext = sinon.stub();
            delete require.cache[executePath];
            require.cache[executeContextPath] = {
                id: executeContextPath, filename: executeContextPath, loaded: true, exports: executeContext
            };

            bridge = new (require('events'))();
            bridge.dispatch = sinon.spy();
            require(executePath)(bridge, {});
            bridge.emit('initialize', initOptions);
        }

        function executeOptions (options) {
            bridge.emit('execute', 'id', { listen: 'test', script: { exec: 'pm.test("x", () => {})' } }, {}, options);

            return executeContext.lastCall.args[7];
        }

        afterEach(function () {
            delete require.cache[executeContextPath];
            delete require.cache[executePath];
        });

        it('should take the option from init', function () {
            boot({ skipUnusedResponseBody: true });
            expect(executeOptions({})).to.have.property('skipUnusedResponseBody', true);
        });

        it('should let the execution option override the init option', function () {
            boot({ skipUnusedResponseBody: false });
            expect(executeOptions({ skipUnusedResponseBody: true })).to.have.property('skipUnusedResponseBody', true);

            boot({ skipUnusedResponseBody: true });
            expect(executeOptions({ skipUnusedResponseBody: false })).to.have.property('skipUnusedResponseBody', false);
        });
    });

    describe('execute context', function () {
        var executeContext = require('../../../lib/sandbox/execute-context'),
            noop = function () { /* stub */ },
            setup;

        function skipFor (code, options) {
            executeContext({ reset: noop, import: noop, exec: noop }, code, {}, console, {}, {}, noop, options);

            return setup.lastCall.args[3].skipResponseBody;
        }

        beforeEach(function () {
            setup = sinon.stub(legacy, 'setup');
        });

        afterEach(function () {
            setup.restore();
        });

        it('should skip the body for a script that cannot reach it', function () {
            expect(skipFor('pm.test("x", () => {})', { skipUnusedResponseBody: true })).to.be.true;
        });

        it('should keep the body for a script that names it', function () {
            expect(skipFor('JSON.parse(responseBody)', { skipUnusedResponseBody: true })).to.be.false;
        });

        it('should keep the body without the option', function () {
            expect(skipFor('pm.test("x", () => {})', {})).to.be.false;
        });
    });

    describe('legacy interface', function () {
        var execution;

        beforeEach(function () {
            execution = {
                globals: { syncVariablesTo: () => { return {}; } },
                environment: { syncVariablesTo: () => { return {}; } },
                response: {
                    responseSize: body.length,
                    text: sinon.stub().returns(body),
                    headers: { each: () => { /* no headers */ } }
                }
            };
        });

        it('should not compute "responseBody" when told to skip it', function () {
            const scope = { import: sinon.spy() };

            legacy.setup(scope, execution, console, { skipResponseBody: true });

            expect(execution.response.text).to.not.be.called;
            expect(scope.import.firstCall.args[0]).to.have.property('responseBody', undefined);
        });

        it('should compute "responseBody" by default', function () {
            const scope = { import: sinon.spy() };

            legacy.setup(scope, execution, console);

            expect(execution.response.text).to.be.calledOnce;
            expect(scope.import.firstCall.args[0]).to.have.property('responseBody', body);
        });
    });

    describe('mayAccessResponseBody', function () {
        it('should be false for scripts with no way to reach "responseBody"', function () {
            [
                'pm.test("ok", () => pm.response.to.have.status(200));',
                'const data = pm.response.json(); pm.environment.set("token", data.token);',
                'tests["ok"] = responseCode.code === 200;',
                'pm.sendRequest("https://example.com", function (err, res) { console.log(res.code); });',
                'const selfish = 1, thistle = 2, evaluate = () => selfish + thistle;'
            ].forEach((code) => {
                expect(legacy.mayAccessResponseBody(code), code).to.be.false;
            });
        });

        it('should be true for scripts that name it or can build the name at runtime', function () {
            [
                'JSON.parse(responseBody)',
                'respons\\u0065Body',
                '\\u{72}esponseBody',
                '\\u0065val("respon" + "seBody")',
                'eval("respon" + "seBody")',
                'new Function("return responseBody")()',
                'this["respon" + "seBody"]',
                'arguments[0]',
                'globalThis[name]',
                'global[name]',
                'self[name]',
                'window[name]'
            ].forEach((code) => {
                expect(legacy.mayAccessResponseBody(code), code).to.be.true;
            });
        });

        it('should be true when there is no code to inspect', function () {
            expect(legacy.mayAccessResponseBody(undefined)).to.be.true;
        });
    });
});
