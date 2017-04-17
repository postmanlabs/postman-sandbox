describe('sandbox library - chai-postman', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
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

                    pm.expect(response).to.be.jsonBody;
                `, done);
            });

            it('must be able to assert invalid json', function (done) {
                context.execute(`
                    var response = new (require('postman-collection').Response)({
                        code: 200,
                        body: 'undefined'
                    });

                    pm.expect(response).to.be.jsonBody;
                `, function (err) {
                    expect(err).be.ok();
                    expect(err).have.property('name', 'AssertionError');
                    expect(err).have.property('message',
                        'expected response body to be a valid json but got error Unexpected token \'u\' at 1:1');
                    done();
                });
            });
        });
    });
});
