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
            }],
            collectionVariables: [{
                key: 'var1',
                value: 'collection-var1',
                type: 'string'
            }, {
                key: 'var3',
                value: 'collection-var3'
            }],
            data: {
                'var1': 'one-data'
            }
        },
        context;

    beforeEach(function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
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

        it('pm.globals.toObject must return a pojo', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(_.isPlainObject(pm.globals.toObject()), true);
                assert.deepEqual(pm.globals.toObject(), {
                    var1: 'one',
                    var2: 2
                });
            `, {context: sampleContextData}, done);
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

        it('pm.environment.toObject must return a pojo', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(_.isPlainObject(pm.environment.toObject()), true);
                assert.deepEqual(pm.environment.toObject(), {
                    var1: 'one-env',
                    var2: 2.5
                });
            `, {context: sampleContextData}, done);
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

        it('when serialized should not have assertion helpers added by sandbox', function (done) {
            context.execute(`
                var assert = require('assert'),
                    reqJSON;

                try {
                    reqJSON = pm.request.toJSON();
                    assert.deepEqual(reqJSON.url, {
                        protocol: 'https',
                        path: ['get'],
                        host: ['postman-echo', 'com'],
                        query: [{ key: 'foo', value: 'bar' }],
                        variable: []
                    });
                    assert.strictEqual(reqJSON.method, 'GET');
                    assert.equal(reqJSON.to, undefined);
                }
                catch (e) {
                    assert.equal(e, null);
                }
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

        it('when serialized should not have assertion helpers added by sandbox', function (done) {
            context.execute(`
                var assert = require('assert'),
                    resJSON;

                try {
                    resJSON = pm.response.toJSON();
                    assert.strictEqual(resJSON.code, 200);
                    assert.equal(resJSON.to, undefined);
                }
                catch (e) {
                    assert.equal(e, null);
                }
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

    describe('cookies', function () {
        it('must be available', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(typeof pm.cookies, 'object', 'cookies must be defined');
            `, {
                context: {
                    cookies: []
                }
            }, done);
        });

        it('must convert context cookie array to list', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.cookies.count(), 2, 'two cookies must be present');
            `, {
                context: {
                    cookies: [{
                        name: 'cookie1',
                        value: 'onevalue',
                        httpOnly: true
                    }, {
                        name: 'cookie2',
                        value: 'anothervalue'
                    }]
                }
            }, done);
        });

        it('must return value of one cookie', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.cookies.one('cookie2').value, 'anothervalue', 'value must be defined');
            `, {
                context: {
                    cookies: [{
                        name: 'cookie1',
                        value: 'onevalue',
                        httpOnly: true
                    }, {
                        name: 'cookie2',
                        value: 'anothervalue'
                    }]
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

    describe('iterationData', function () {
        it('should be an instance of VariableScope', function (done) {
            context.execute(`
                var assert = require('assert'),
                    VariableScope = require('postman-collection').VariableScope;
                assert.strictEqual(VariableScope.isVariableScope(pm.iterationData), true);
            `, {context: sampleContextData}, done);
        });
        it('pm.data must not exist', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(pm.data, undefined);
            `, {context: sampleContextData}, done);
        });
        it('accesses the current iteration data via pm.iterationData', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(pm.iterationData.get('var1'), 'one-data');
            `, {context: sampleContextData}, done);
        });
        it('pm.iterationData.toObject must return a pojo', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(_.isPlainObject(pm.iterationData.toObject()), true);
                assert.deepEqual(pm.iterationData.toObject(), {
                    var1: 'one-data'
                });
            `, {context: sampleContextData}, done);
        });
    });

    describe('sendRequest', function () {
        it('must be a function exposed', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual((typeof pm.sendRequest), 'function');
            `, {context: sampleContextData}, done);
        });

        it('must dispatch an `execution.request.id` event when called', function (done) {
            var executionId = '1';

            context.on('execution.request.' + executionId, function (cursor, id, requestId, req) {
                expect(req.url).to.eql({
                    protocol: 'https',
                    path: ['get'],
                    host: ['postman-echo', 'com'],
                    query: [],
                    variable: []
                });
                done();
            });

            context.execute(`
                pm.sendRequest('https://postman-echo.com/get');
            `, {
                context: sampleContextData,
                id: executionId
            }, function () {}); // eslint-disable-line no-empty-function
        });

        it('must forward response to callback when sent from outside', function (done) {
            var executionId = '2';
            context.on('error', done);

            context.on('execution.error', function (cur, err) {
                expect(err).to.not.be.ok();
                done();
            });

            // @todo find the cause of the error where assertions are not being fired from inside a timer
            context.on('execution.assertion', function (cursor, assertions) {
                assertions.forEach(function (ass) {
                    expect(ass).to.have.property('passed', true);
                    expect(ass).to.have.property('error', null);
                });
                done();
            });

            context.on('execution.request.' + executionId, function (cursor, id, requestId, req) {
                expect(req.url).to.eql({
                    protocol: 'https',
                    path: ['get'],
                    host: ['postman-echo', 'com'],
                    query: [],
                    variable: []
                });
                context.dispatch(`execution.response.${id}`, requestId, null, {
                    code: 200,
                    body: '{"i am": "a json"}'
                });
            });

            context.execute(`
                pm.sendRequest('https://postman-echo.com/get', function (err, res) {
                    pm.test('response', function () {
                        pm.expect(res).to.have.property('code', 200);
                        pm.expect(res.json()).to.have.property('i am', 'a json');
                    });
                });
            `, {
                context: sampleContextData,
                id: executionId
            }, function () {}); // eslint-disable-line no-empty-function
        });
    });
});
