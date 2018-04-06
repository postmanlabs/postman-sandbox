describe('sandbox library - chai-postman', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
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

    describe('sdk object verification', function () {
        it('must have assertion failure when checking response to be request', function (done) {
            context.execute(`
                var Response = require('postman-collection').Response;
                pm.expect(new Response({code: 102})).to.be.postmanRequest;
            `, function (err) {
                expect(err).to.be.ok();
                expect(err).to.have.property('name', 'AssertionError');
                expect(err).to.have.property('message',
                    'expecting a postman request object but got { Object (id, _details, ...) }');
                done();
            });
        });

        it('must have assertion to verify response instance', function (done) {
            context.execute(`
                var Response = require('postman-collection').Response,
                    Request = require('postman-collection').Request;

                pm.expect(new Response({code: 102})).to.be.postmanResponse;
                pm.expect(new Request({url: 'https://postman-echo.com'})).to.not.be.postmanResponse;
            `, done);
        });

        it('must have assertion to verify request instance', function (done) {
            context.execute(`
                var Response = require('postman-collection').Response,
                    Request = require('postman-collection').Request;

                pm.expect(new Request({url: 'https://postman-echo.com'})).to.be.postmanRequest;
                pm.expect(new Response({code: 102})).to.not.be.postmanRequest;
            `, done);
        });

        it('must have assertion failure when response object is passed to check request', function (done) {
            context.execute(`
                var Response = require('postman-collection').Response;
                pm.expect(new Response({code: 102})).to.be.postmanRequest;
            `, function (err) {
                expect(err).to.be.ok();
                expect(err).to.have.property('name', 'AssertionError');
                expect(err).to.have.property('message',
                    'expecting a postman request object but got { Object (id, _details, ...) }');
                done();
            });
        });

        it('must have assertion to verify either request or response instance', function (done) {
            context.execute(`
                var Response = require('postman-collection').Response,
                    Request = require('postman-collection').Request,
                    Header = require('postman-collection').Header;

                pm.expect(new Request({url: 'https://postman-echo.com'})).to.be.postmanRequestOrResponse;
                pm.expect(new Response({code: 102})).to.be.postmanRequestOrResponse;;
                pm.expect(new Header('key:value')).to.not.be.postmanRequestOrResponse;;
            `, done);
        });

        it('must have assertion assertion failure when header instance is sent instead of reqOrRes', function (done) {
            context.execute(`
                var Header = require('postman-collection').Header;
                pm.expect(new Header('key:value')).to.be.postmanRequestOrResponse;;
            `, function (err) {
                expect(err).to.be.ok();
                expect(err).to.have.property('name', 'AssertionError');
                expect(err).to.have.property('message',
                    'expecting a postman request or response object but got { Object (key, value) }');
                done();
            });
        });
    });

    describe('response assertion', function () {
        describe('status code class', function () {
            it('should be able to assert standard status classes', function (done) {
                context.execute(`
                    var Response = require('postman-collection').Response;

                    pm.expect(new Response({code: 102})).to.have.statusCodeClass(1);
                    pm.expect(new Response({code: 202})).to.have.statusCodeClass(2);
                    pm.expect(new Response({code: 302})).to.have.statusCodeClass(3);
                    pm.expect(new Response({code: 402})).to.have.statusCodeClass(4);
                    pm.expect(new Response({code: 502})).to.have.statusCodeClass(5);
                `, done);
            });

            it('should have properties set for common status code classes', function (done) {
                context.execute(`
                    var Response = require('postman-collection').Response;

                    pm.expect(new Response({code: 101})).to.be.info;
                    pm.expect(new Response({code: 201})).to.be.success;
                    pm.expect(new Response({code: 301})).to.be.redirection;
                    pm.expect(new Response({code: 401})).to.be.clientError;
                    pm.expect(new Response({code: 501})).to.be.serverError;

                    pm.expect(new Response({code: 501})).to.be.error;
                    pm.expect(new Response({code: 401})).to.be.error;
                `, done);
            });

            // @todo: add more of such failing assertions, one for each 5 classes
            it('should be able to assert failing class "info"', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200
                    });

                    pm.expect(response).to.have.statusCodeClass(1);
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected response code to be 1XX but found 200');
                    done();
                });
            });
        });

        describe('status code', function () {
            it('should be able to assert failing code 404', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 404
                    });

                    pm.expect(response).to.not.have.statusCode(404);
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected response to not have status code 404');
                    done();
                });
            });
        });

        describe('status code reason', function () {
            it('should be able to verify status reason', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200
                    });

                    pm.expect(response).to.have.statusReason('Not Found');
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected response to have status reason \'Not Found\' but got \'OK\'');
                    done();
                });
            });
        });

        describe('polymorphic .status', function () {
            it('should be able to verify status reason', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200
                    });

                    pm.expect(response).to.have.status('Not Found');
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected response to have status reason \'Not Found\' but got \'OK\'');
                    done();
                });
            });

            it('should be able to assert failing code 404', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 404
                    });

                    pm.expect(response).to.not.have.status(404);
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected response to not have status code 404');
                    done();
                });
            });
        });

        describe('headers', function () {
            it('should be able to determine existence of a key', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        header: 'oneHeader:oneValue'
                    });

                    pm.expect(response).to.have.header('oneHeader');
                    pm.expect(response).to.have.header('oneHeader', 'oneValue');
                `, done);
            });

            it('should be able to determine absence of a key', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        header: 'oneHeader:oneValue'
                    });

                    pm.expect(response).not.to.have.header('oneHeader');
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected response to not have header with key \'oneHeader\'');
                    done();
                });
            });

            it('should be able to determine mismatch of a key\'s value', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        header: 'oneHeader:oneValue'
                    });

                    pm.expect(response).to.have.header('oneHeader', 'noValue');
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected \'oneHeader\' response header to be \'noValue\' but got \'oneValue\'');
                    done();
                });
            });
        });

        describe('body', function () {
            it('must have a property to assert valid text body', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: 'this is a body'
                    });

                    pm.expect(response).to.be.withBody;
                `, done);
            });

            it('must be able to assert invalid text body', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200
                    });

                    pm.expect(response).to.be.withBody;
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected response to have content in body');
                    done();
                });
            });

            it('must have a property to assert valid json', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: '{"hello": "world"}'
                    });

                    pm.expect(response).to.be.json;
                `, done);
            });

            it('must be able to assert invalid json', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: 'undefined'
                    });

                    pm.expect(response).to.be.json;
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected response body to be a valid json but got error Unexpected token \'u\' at 1:1');
                    done();
                });
            });

            it('must be able to ensure negation of body exists using .body function', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: 'undefined'
                    });

                    pm.expect(response).to.not.have.body();
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected response to not have content in body');
                    done();
                });
            });

            it('must be able to ensure body matches a string negation', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: 'undefined'
                    });

                    pm.expect(response).to.not.have.body('undefined');
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected response body to not equal \'undefined\'');
                    done();
                });
            });

            it('must be able to ensure body matches a regexp negation', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: 'undefined'
                    });

                    pm.expect(response).to.not.have.body(/def/);
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected response body text \'undefined\' to not match /def/');
                    done();
                });
            });

            it('must be able to ensure body contains json using .json', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: 'undefined'
                    });

                    pm.expect(response).to.have.jsonBody();
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected response body to be a valid json but got error Unexpected token \'u\' at 1:1');
                    done();
                });
            });

            it('must be able to ensure body does not contain json using .json negation', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: '{"prop":[{"value":{"oh":"wow"}}]}'
                    });

                    pm.expect(response).to.not.have.jsonBody();
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected response body not to be a valid json');
                    done();
                });
            });

            it('must be able to ensure body contain json data in path', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: '{"prop":[{"value":{"oh":"wow"}}]}'
                    });

                    pm.expect(response).to.not.have.jsonBody('prop[0]');
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        // eslint-disable-next-line max-len
                        'expected { prop: [ { value: [Object] } ] } in response to not contain property \'prop[0]\'');
                    done();
                });
            });

            it('must be able to ensure body contain a particular json value in path', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: '{"prop":[{"value":{"oh":"wow"}}]}'
                    });

                    pm.expect(response).to.have.jsonBody('prop[0].value', {v:1});
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        // eslint-disable-next-line max-len
                        'expected response body json at "prop[0].value" to contain { v: 1 } but got { oh: \'wow\' }');
                    done();
                });
            });
        });

        describe('response time', function () {
            it('should have a way to be asserted for presence', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        responseTime: 200
                    });

                    pm.expect(response).to.have.responseTime();
                `, done);
            });

            // eslint-disable-next-line max-len
            (typeof window === 'undefined' ? it : it.skip)('should have a way to be asserted for absence', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        responseTime: NaN
                    });
                    pm.expect(response).to.have.responseTime();
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected { Object (id, _details, ...) } to have property \'responseTime\'');
                    done();
                });
            });

            it('should allow numeric assertions to check less-than', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        responseTime: 200
                    });
                    pm.expect(response).to.have.responseTime.below(100);
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected 200 to be below 100');
                    done();
                });
            });
        });

        describe('response size', function () {
            it('must be able assert below a figure', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        header: 'oneHeader:oneValue',
                        stream: new Buffer('hello there')
                    });

                    pm.expect(response).to.have.responseSize.below(50);
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message', 'expected 51 to be below 50');
                    done();
                });
            });
        });
    });
});
