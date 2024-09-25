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
