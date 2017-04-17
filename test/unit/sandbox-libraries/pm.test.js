describe('sandbox library - pm api', function () {
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
            }]
        },
        context;

    beforeEach(function (done) {
        Sandbox.createContext(function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('pm object should be in globals', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual(typeof pm, 'object');
        `, done);
    });

    describe('info', function () {
        it('must have relevant information', function (done) {
            context.execute({
                listen: 'test',
                script: `
                    var assert = require('assert');

                    assert.strictEqual(pm.info.eventName, 'test', 'event name must be test');
                    assert.strictEqual(pm.info.iteration, 2, 'iteration should be 2');
                    assert.strictEqual(pm.info.iterationCount, 3, 'iteration total should be 3');
                    assert.strictEqual(pm.info.requestName, 'request-name', 'requestName should be accurate');
                    assert.strictEqual(pm.info.requestId, 'request-id', 'requestId should be accurate');
                `
            }, {
                cursor: {
                    iteration: 2,
                    cycles: 3
                },
                legacy: {
                    _itemName: 'request-name',
                    _itemId: 'request-id'
                }

            }, done);
        });
    });

    describe('globals', function () {
        it('must be defined as VariableScope', function (done) {
            context.execute(`
                var assert = require('assert'),
                    VariableScope = require('postman-collection').VariableScope;
                assert.strictEqual(VariableScope.isVariableScope(pm.globals), true);
            `, done);
        });

        it('must be a readonly property', function (done) {
            context.execute(`
                var assert = require('assert'),
                    _globals;

                _globals = pm.globals;
                pm.globals = [];

                assert.strictEqual(pm.globals, _globals, 'property stays inchanged');
            `, done);
        });

        it('must forward global variables forwarded during execution', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.globals.get('var1'), 'one');
                assert.strictEqual(pm.globals.get('var2'), 2);
            `, {context: sampleContextData}, done);
        });

        it('must propagate updated globals from inside sandbox', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(pm.globals.get('var1'), 'one');
                pm.globals.set('var1', 'one-one');
                assert.strictEqual(pm.globals.get('var1'), 'one-one');

            `, {context: sampleContextData}, function (err, exec) {
                expect(err).not.be.ok();
                expect(exec).be.ok();
                expect(exec.globals.values).eql([
                    {type: 'any', value: 'one-one', key: 'var1'},
                    {type: 'number', value: 2, key: 'var2'}
                ]);
                done();
            });
        });
    });

    describe('environment', function () {
        it('must be defined as VariableScope', function (done) {
            context.execute(`
                var assert = require('assert'),
                    VariableScope = require('postman-collection').VariableScope;
                assert.strictEqual(VariableScope.isVariableScope(pm.environment), true);
            `, done);
        });

        it('must be a readonly property', function (done) {
            context.execute(`
                var assert = require('assert'),
                    _environment;

                _environment = pm.globals;
                pm.globals = [];

                assert.strictEqual(pm.globals, _environment, 'property stays inchanged');
            `, done);
        });

        it('must forward environment variables forwarded during execution', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.environment.get('var1'), 'one-env');
                assert.strictEqual(pm.environment.get('var2'), 2.5);
            `, {context: sampleContextData}, done);
        });

        it('must propagate updated environment from inside sandbox', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(pm.environment.get('var1'), 'one-env');
                pm.environment.set('var1', 'one-one-env');
                assert.strictEqual(pm.environment.get('var1'), 'one-one-env');

            `, {context: sampleContextData}, function (err, exec) {
                expect(err).not.be.ok();
                expect(exec).be.ok();
                expect(exec.environment.values).eql([
                    {type: 'any', value: 'one-one-env', key: 'var1'},
                    {type: 'number', value: 2.5, key: 'var2'}
                ]);
                done();
            });
        });
    });

    describe('request', function () {
        it('must be defined as sdk Request object', function (done) {
            context.execute(`
                var assert = require('assert'),
                    Request = require('postman-collection').Request;
                assert.strictEqual(Request.isRequest(pm.request), true);
            `, {
                context: {
                    request: 'https://postman-echo.com/get?foo=bar'
                }
            }, done);
        });

        it('must not be defined if request is missing in generic script target', function (done) {
            context.execute(`
                var assert = require('assert'),
                    Request = require('postman-collection').Request;
                assert.strictEqual(Request.isRequest(pm.request), false);
            `, done);
        });

        it('must be defined in prerequest script even if request is missing in context', function (done) {
            context.execute({
                listen: 'prerequest',
                script: `
                var assert = require('assert'),
                    Request = require('postman-collection').Request;
                assert.strictEqual(Request.isRequest(pm.request), true);
            `
            }, done);
        });

        it('must be defined in test script even if request is missing in context', function (done) {
            context.execute({
                listen: 'test',
                script: `
                var assert = require('assert'),
                    Request = require('postman-collection').Request;
                assert.strictEqual(Request.isRequest(pm.request), true);
            `
            }, done);
        });
    });

    describe('response', function () {
        it('must be defined as sdk Request object', function (done) {
            context.execute(`
                var assert = require('assert'),
                    Response = require('postman-collection').Response;

                assert.strictEqual(Response.isResponse(pm.response), true, 'pm.response should be sdk');
                assert.strictEqual(pm.response.code, 200, 'code should match');
            `, {
                context: {
                    response: {
                        code: 200
                    }
                }
            }, done);
        });

        it('must not be defined for non test targets', function (done) {
            context.execute(`
                var assert = require('assert'),
                    Response = require('postman-collection').Response;
                assert.strictEqual(Response.isResponse(pm.response), false);
            `, done);
        });

        it('must be defined in test target even when context is missing', function (done) {
            context.execute({
                listen: 'test',
                script: `
                    var assert = require('assert'),
                        Response = require('postman-collection').Response;
                    assert.strictEqual(Response.isResponse(pm.response), true);
                `
            }, done);
        });

        it('must parse response json body', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.equal(pm.response.body, undefined, 'body should not be defined as string');
                assert.deepEqual(pm.response.json(), {
                    foo: "bar"
                });
            `, {
                context: {
                    response: {
                        code: 200,
                        stream: {
                            type: 'Buffer',
                            data: [123, 34, 102, 111, 111, 34, 58, 32, 34, 98, 97, 114, 34, 125]
                        }
                    }
                }
            }, done);
        });
    });

    describe('chai', function () {
        it('must be available as expect', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.expect, require('chai').expect);
            `, done);
        });

        it('must work with common assertions', function (done) {
            context.execute(`
                pm.expect(new Error).not.to.be.an('error');
            `, function (err) {
                expect(err).be.ok();
                expect(err).have.property('message', 'expected [Error] not to be an error');
                done();
            });
        });

        it('must pre-assert response', function (done) {
            context.execute(`
                pm.expect(pm.response).to.have.property('to');
                pm.expect(pm.response.to).be.an('object');

                // run a test as well ;-)
                pm.response.to.be.ok;
            `, {
                context: {
                    response: {code: 200}
                }
            }, done);
        });

        it('must pre-assert request', function (done) {
            context.execute(`
                pm.expect(pm.request).to.have.property('to');
                pm.expect(pm.request.to).be.an('object');
            `, {
                context: {
                    request: 'https://postman-echo.com/'
                }
            }, done);
        });
    });
});
