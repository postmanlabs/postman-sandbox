const CookieStore = require('tough-cookie').Store;

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
                key: 'var2',
                value: 2.9,
                type: 'number'
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
        it('should have relevant information', function (done) {
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
        it('should be defined as VariableScope', function (done) {
            context.execute(`
                var assert = require('assert'),
                    VariableScope = require('postman-collection').VariableScope;
                assert.strictEqual(VariableScope.isVariableScope(pm.globals), true);
            `, done);
        });

        it('should be a readonly property', function (done) {
            context.execute(`
                var assert = require('assert'),
                    _globals;

                _globals = pm.globals;
                pm.globals = [];

                assert.strictEqual(pm.globals, _globals, 'property stays unchanged');
            `, done);
        });

        it('should forward global variables forwarded during execution', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.globals.get('var1'), 'one');
                assert.strictEqual(pm.globals.get('var2'), 2);
            `, {context: sampleContextData}, done);
        });

        it('should propagate updated globals from inside sandbox', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(pm.globals.get('var1'), 'one');
                pm.globals.set('var1', 'one-one');
                assert.strictEqual(pm.globals.get('var1'), 'one-one');

            `, {context: sampleContextData}, function (err, exec) {
                expect(err).to.be.null;
                expect(exec).to.be.ok;
                expect(exec).to.deep.nested.include({'globals.values': [
                    {type: 'any', value: 'one-one', key: 'var1'},
                    {type: 'number', value: 2, key: 'var2'}
                ]});
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
        it('should be defined as VariableScope', function (done) {
            context.execute(`
                var assert = require('assert'),
                    VariableScope = require('postman-collection').VariableScope;
                assert.strictEqual(VariableScope.isVariableScope(pm.environment), true);
            `, done);
        });

        it('should be a readonly property', function (done) {
            context.execute(`
                var assert = require('assert'),
                    _environment;

                _environment = pm.environment;
                pm.environment = [];

                assert.strictEqual(pm.environment, _environment, 'property stays unchanged');
            `, done);
        });

        it('should forward environment variables forwarded during execution', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.environment.get('var1'), 'one-env');
                assert.strictEqual(pm.environment.get('var2'), 2.5);
            `, {context: sampleContextData}, done);
        });

        it('should propagate updated environment from inside sandbox', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(pm.environment.get('var1'), 'one-env');
                pm.environment.set('var1', 'one-one-env');
                assert.strictEqual(pm.environment.get('var1'), 'one-one-env');

            `, {context: sampleContextData}, function (err, exec) {
                expect(err).to.be.null;
                expect(exec).to.be.ok;
                expect(exec).to.deep.nested.include({'environment.values': [
                    {type: 'any', value: 'one-one-env', key: 'var1'},
                    {type: 'number', value: 2.5, key: 'var2'}
                ]});
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

    describe('collectionVariables', function () {
        it('should be defined as VariableScope', function (done) {
            context.execute(`
                var assert = require('assert'),
                    VariableScope = require('postman-collection').VariableScope;
                assert.strictEqual(VariableScope.isVariableScope(pm.collectionVariables), true);
            `, done);
        });

        it('should be a readonly property', function (done) {
            context.execute(`
                var assert = require('assert'),
                    _collectionVariables;

                _collectionVariables = pm.collectionVariables;
                pm.collectionVariables = [];

                assert.strictEqual(pm.collectionVariables, _collectionVariables, 'property stays unchanged');
            `, done);
        });

        it('should forward collection variables forwarded during execution', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.collectionVariables.get('var1'), 'collection-var1');
                assert.strictEqual(pm.collectionVariables.get('var2'), 2.9);
            `, {context: sampleContextData}, done);
        });

        it('should propagate updated collection variables from inside sandbox', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(pm.collectionVariables.get('var1'), 'collection-var1');
                pm.collectionVariables.set('var1', 'one-one-env');
                assert.strictEqual(pm.collectionVariables.get('var1'), 'one-one-env');

            `, {context: sampleContextData}, function (err, exec) {
                expect(err).to.be.null;
                expect(exec).to.be.ok;
                expect(exec).to.deep.nested.include({'collectionVariables.values': [
                    {type: 'string', value: 'one-one-env', key: 'var1'},
                    {type: 'number', value: 2.9, key: 'var2'}
                ]});
                done();
            });
        });

        it('pm.collectionVariables.toObject must return a pojo', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(_.isPlainObject(pm.collectionVariables.toObject()), true);
                assert.deepEqual(pm.collectionVariables.toObject(), {
                    var1: 'collection-var1',
                    var2: 2.9
                });
            `, {context: sampleContextData}, done);
        });
    });

    describe('request', function () {
        it('should be defined as sdk Request object', function (done) {
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

        it('should not be defined if request is missing in generic script target', function (done) {
            context.execute(`
                var assert = require('assert'),
                    Request = require('postman-collection').Request;
                assert.strictEqual(Request.isRequest(pm.request), false);
            `, done);
        });

        it('should be defined in prerequest script even if request is missing in context', function (done) {
            context.execute({
                listen: 'prerequest',
                script: `
                var assert = require('assert'),
                    Request = require('postman-collection').Request;
                assert.strictEqual(Request.isRequest(pm.request), true);
            `
            }, done);
        });

        it('should be defined in test script even if request is missing in context', function (done) {
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
        it('should be defined as sdk Request object', function (done) {
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

        it('should not be defined for non test targets', function (done) {
            context.execute(`
                var assert = require('assert'),
                    Response = require('postman-collection').Response;
                assert.strictEqual(Response.isResponse(pm.response), false);
            `, done);
        });

        it('should be defined in test target even when context is missing', function (done) {
            context.execute({
                listen: 'test',
                script: `
                    var assert = require('assert'),
                        Response = require('postman-collection').Response;
                    assert.strictEqual(Response.isResponse(pm.response), true);
                `
            }, done);
        });

        it('should parse response json body', function (done) {
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
        it('should be available', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(typeof pm.cookies, 'object', 'cookies must be defined');
            `, {
                context: {
                    cookies: []
                }
            }, done);
        });

        it('should convert context cookie array to list', function (done) {
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

        it('should return value of one cookie', function (done) {
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

    describe('cookies.jar', function () {
        // @note don't strictly assert (calledWithExactly) on store method args
        var getStoreEventHandler = function (executionId) {
                return function (eventId, action, fnName) {
                    var output;

                    if (action !== 'store') {
                        return;
                    }

                    if (fnName === 'findCookie') {
                        output = {};
                    }
                    else if (['getAllCookies', 'findCookies'].includes(fnName)) {
                        output = [];
                    }

                    context.dispatch(`execution.cookies.${executionId}`, eventId, null, output);
                };
            },
            getErrorEventHandler = function (callback) {
                // errors from the execute callback are catched here as well
                // so, call mocha `done` callback with an error
                // @todo this is not supposed to happen, fix this
                return function () {
                    callback(new Error('Assertion Error'));
                };
            };

        it('should be a function exposed', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(typeof pm.cookies.jar, 'function');
                assert.strictEqual(pm.cookies.jar().constructor.name, 'PostmanCookieJar');
            `, {
                context: {cookies: []}
            }, done);
        });

        it('should dispatch store events when `set` is called', function (done) {
            var executionId = '1',
                executionError = sinon.spy(getErrorEventHandler(done)),
                executionCookies = sinon.spy(getStoreEventHandler(executionId));

            context.on('execution.error', executionError);
            context.on('execution.cookies.' + executionId, executionCookies);

            context.execute(`
                var jar = pm.cookies.jar();

                jar.set("http://example.com/", "a=b; Domain=example.com; Path=/", function () {});
            `, {
                context: {cookies: []},
                id: executionId
            }, function (err) {
                if (err) { return done(err); }

                var methodArgs;

                expect(executionError).to.not.have.been.called;
                expect(executionCookies).to.have.been.calledTwice;

                // assert for findCookie event
                expect(executionCookies.getCall(0).args).to.have.lengthOf(4);
                expect(executionCookies.getCall(0)).to.have.been
                    .calledWith(1, 'store', 'findCookie');

                methodArgs = executionCookies.getCall(0).args[3];

                expect(methodArgs).to.be.an('array');
                expect(CookieStore.prototype).to.have.own.property('findCookie');
                expect(CookieStore.prototype.findCookie).to.have.lengthOf(methodArgs.length + 1);

                // assert for updateCookie event
                expect(executionCookies.getCall(1).args).to.have.lengthOf(4);
                expect(executionCookies.getCall(1)).to.have.been
                    .calledWith(2, 'store', 'updateCookie');

                methodArgs = executionCookies.getCall(1).args[3];

                expect(methodArgs).to.be.an('array');
                expect(CookieStore.prototype).to.have.own.property('updateCookie');
                expect(CookieStore.prototype.updateCookie).to.have.lengthOf(methodArgs.length + 1);

                done();
            });
        });

        it('should dispatch store events when `get` is called', function (done) {
            var executionId = '2',
                executionError = sinon.spy(getErrorEventHandler(done)),
                executionCookies = sinon.spy(getStoreEventHandler(executionId));

            context.on('execution.error', executionError);
            context.on('execution.cookies.' + executionId, executionCookies);

            context.execute(`
                var jar = pm.cookies.jar();
                jar.get("http://example.com/", 'a', function () {})
            `, {
                context: {cookies: []},
                id: executionId
            }, function (err) {
                if (err) { return done(err); }

                var methodArgs;

                expect(executionError).to.not.have.been.called;
                expect(executionCookies).to.have.been.calledOnce;

                // assert for findCookies event
                expect(executionCookies.getCall(0).args).to.have.lengthOf(4);
                expect(executionCookies.getCall(0)).to.have.been
                    .calledWith(1, 'store', 'findCookies');

                methodArgs = executionCookies.getCall(0).args[3];

                expect(methodArgs).to.be.an('array');
                expect(CookieStore.prototype).to.have.own.property('findCookies');
                expect(CookieStore.prototype.findCookies).to.have.lengthOf(methodArgs.length + 1);

                done();
            });
        });

        it('should dispatch store events when `getAll` is called', function (done) {
            var executionId = '3',
                executionError = sinon.spy(getErrorEventHandler(done)),
                executionCookies = sinon.spy(getStoreEventHandler(executionId));

            context.on('execution.error', executionError);
            context.on('execution.cookies.' + executionId, executionCookies);

            context.execute(`
                var jar = pm.cookies.jar();
                jar.getAll("http://example.com/", function () {})
            `, {
                context: {cookies: []},
                id: executionId
            }, function (err) {
                if (err) { return done(err); }

                var methodArgs;

                expect(executionError).to.not.have.been.called;
                expect(executionCookies).to.have.been.calledOnce;

                // assert for findCookies event
                expect(executionCookies.getCall(0).args).to.have.lengthOf(4);
                expect(executionCookies.getCall(0)).to.have.been
                    .calledWith(1, 'store', 'findCookies');

                methodArgs = executionCookies.getCall(0).args[3];

                expect(methodArgs).to.be.an('array');
                expect(CookieStore.prototype).to.have.own.property('findCookies');
                expect(CookieStore.prototype.findCookies).to.have.lengthOf(methodArgs.length + 1);

                done();
            });
        });
    });

    describe('chai', function () {
        it('should be available as expect', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.expect, require('chai').expect);
            `, done);
        });

        it('should work with common assertions', function (done) {
            context.execute(`
                pm.expect(new Error).to.not.be.an('error');
            `, function (err) {
                expect(err).to.be.ok;
                expect(err).have.property('message', 'expected [Error] not to be an error');
                done();
            });
        });

        it('should pre-assert response', function (done) {
            context.execute(`
                pm.expect(pm.response).to.have.property('to');
                pm.expect(pm.response.to).to.be.an('object');

                // run a test as well ;-)
                pm.response.to.be.ok;
                pm.response.to.not.be.a.postmanRequest;

                pm.response.to.not.be.serverError;
                pm.response.to.not.have.statusCode(400);

                pm.response.to.have.statusCode(200);
                pm.response.to.have.statusReason('OK');
            `, {
                context: {
                    response: {code: 200}
                }
            }, done);
        });

        it('should pre-assert request', function (done) {
            context.execute(`
                pm.expect(pm.request).to.have.property('to');
                pm.expect(pm.request.to).to.be.an('object');

                pm.request.to.be.ok;

                pm.request.to.not.be.a.postmanResponse;
                pm.request.to.not.have.header('Foo-Bar');

                pm.request.to.have.header('Content-Type');
                pm.request.to.be.a.postmanRequestOrResponse;

            `, {
                context: {
                    request: {
                        url: 'https://postman-echo.com/',
                        header: [{
                            key: 'Content-Type',
                            value: 'application/json; charset=utf-8'
                        }]
                    }
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

    describe('visualizer', function () {
        it('should have visualizer APIs available', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.ok(pm.visualizer);
                assert.strictEqual(typeof pm.visualizer.set, 'function');
                assert.strictEqual(typeof pm.visualizer.clear, 'function');
            `, {context: sampleContextData}, done);
        });

        describe('pm.visualizer.set', function () {
            it('should correctly set visualizer data', function (done) {
                context.execute(`
                    pm.visualizer.set('Test template', {
                        name: 'Postman'
                    });
                `, {context: sampleContextData}, function (err, result) {
                    expect(err).to.not.be.ok;
                    expect(result).to.have.nested.property('return.visualizer');
                    expect(result.return.visualizer.template).to.eql('Test template');
                    expect(result.return.visualizer.data).to.deep.eql({
                        name: 'Postman'
                    });
                    done();
                });
            });

            it('should throw error for invalid template', function (done) {
                context.execute(`
                    pm.visualizer.set(undefined);
                `, {context: sampleContextData}, function (err) {
                    expect(err).to.be.ok;
                    expect(err.message).to.eql('Invalid template. Template must be of type string, found undefined');
                    done();
                });
            });

            it('should throw error for invalid data', function (done) {
                context.execute(`
                    pm.visualizer.set('Test template', 'invalid data');
                `, {context: sampleContextData}, function (err) {
                    expect(err).to.be.ok;
                    expect(err.message).to.eql('Invalid data. Data must be an object, found string');
                    done();
                });
            });

            it('should throw error for invalid options', function (done) {
                context.execute(`
                    pm.visualizer.set('Test template', {}, 'Invalid options');
                `, {context: sampleContextData}, function (err) {
                    expect(err).to.be.ok;
                    expect(err.message).to.eql('Invalid options. Options must be an object, found string');
                    done();
                });
            });
        });

        describe('pm.visualizer.clear', function () {
            it('should clear visualiser data', function (done) {
                context.execute(`
                    pm.visualizer.set('Test template', {
                        name: 'Postman'
                    });

                    pm.visualizer.clear();
                `, {context: sampleContextData}, function (err, result) {
                    expect(err).to.not.be.ok;
                    expect(result.return.visualizer).to.not.be.ok;
                    done();
                });
            });
        });
    });

    describe('sendRequest', function () {
        it('should be a function exposed', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual((typeof pm.sendRequest), 'function');
            `, {context: sampleContextData}, done);
        });

        it('should dispatch an `execution.request.id` event when called', function (done) {
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

        it('should forward response to callback when sent from outside', function (done) {
            var executionId = '2';
            context.on('error', done);

            context.on('execution.error', function (cur, err) {
                expect(err).to.not.be.ok;
                done();
            });

            // @todo find the cause of the error where assertions are not being fired from inside a timer
            context.on('execution.assertion', function (cursor, assertion) {
                assertion.forEach(function (ass) {
                    expect(ass).to.deep.include({
                        passed: true,
                        error: null
                    });
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

        it('should forward history object to callback when sent from outside', function (done) {
            var executionId = '3';
            context.on('error', done);

            context.on('execution.error', function (cur, err) {
                expect(err).to.not.be.ok;
                done();
            });

            // @todo find the cause of the error where assertions are not being fired from inside a timer
            context.on('execution.assertion', function (cursor, assertion) {
                assertion.forEach(function (ass) {
                    expect(ass).to.deep.include({
                        passed: true,
                        error: null
                    });
                });
                done();
            });

            context.on('execution.request.' + executionId, function (cursor, id, requestId) {
                context.dispatch(`execution.response.${id}`, requestId, null, {
                    code: 200
                }, {
                    cookies: [
                        {
                            domain: 'postman-echo.com',
                            hostOnly: false,
                            httpOnly: true,
                            name: 'foo',
                            path: '/',
                            secure: false,
                            value: 'bar'
                        }
                    ]
                });
            });

            context.execute(`
                var CookieList = require('postman-collection').CookieList;
                pm.sendRequest('https://postman-echo.com/cookies/set?foo=bar', function (err, res, history) {
                    pm.test('history', function () {
                        pm.expect(history).to.be.an('object');
                        pm.expect(history).to.have.property('cookies');
                        pm.expect(CookieList.isCookieList(history.cookies)).to.equal(true);
                        pm.expect(history.cookies.count()).to.equal(1);
                        pm.expect(history.cookies.get('foo')).to.equal('bar');
                    });
                });
            `, {
                context: sampleContextData,
                id: executionId
            }, function () {}); // eslint-disable-line no-empty-function
        });
    });
});
