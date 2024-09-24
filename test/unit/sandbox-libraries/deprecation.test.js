const env = require('../../../lib/environment'),
    DEPRECATED_LIBS = ['atob', 'btoa', 'crypto-js', 'tv4', 'backbone'];

describe('sandbox library - deprecation', function () {
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

    it('should show deprecation warning for "tv4"', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
          const requiredTv4 = require('tv4');
          tv4.validate;
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledTwice;

            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "tv4" library is deprecated. Use "ajv" library instead.');

            expect(consoleSpy.secondCall.args[1]).to.equal('warn');
            expect(consoleSpy.secondCall.args[2])
                .to.equal('Using "tv4" is deprecated. Use "require(\'ajv\')" instead.');

            done();
        });
    });

    it('should show deprecation warning for "crypto-js"', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
          const requiredCryptoJS = require('crypto-js');
          CryptoJS.lib;
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledTwice;

            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "crypto-js" library is deprecated. Use global "crypto" object instead.');

            expect(consoleSpy.secondCall.args[1]).to.equal('warn');
            expect(consoleSpy.secondCall.args[2])
                .to.equal('Using "CryptoJS" is deprecated. Use global "crypto" object instead.');

            done();
        });
    });


    it('should show deprecation warning for "backbone', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
          const requiredBackbone = require('backbone');
          Backbone.Backbone;
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledTwice;

            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "backbone" library is deprecated.');

            expect(consoleSpy.secondCall.args[1]).to.equal('warn');
            expect(consoleSpy.secondCall.args[2])
                .to.equal('Using "Backbone" is deprecated.');

            done();
        });
    });

    it('should show deprecation warning for "atob', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
          const requiredAtob = require('atob');
          atob('YQ==');
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledOnce;

            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "atob" library is deprecated. Use global "atob" function instead.');

            done();
        });
    });

    it('should show deprecation warning for "btoa', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
          const requiredBtoa = require('btoa');
          btoa('a');
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledOnce;

            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "btoa" library is deprecated. Use global "btoa" function instead.');

            done();
        });
    });

    it('should not show warning for non-deprecated libraries', function (done) {
        const consoleSpy = sinon.spy(),
            libs = Object.entries(env.require).map(([key, value]) => {
                return value.expose ?? key;
            }),
            code = libs.map((lib) => {
                return !DEPRECATED_LIBS.includes(lib) ? `require('${lib}');` : '';
            }).join('\n');


        context.on('console', consoleSpy);
        context.execute(code, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.not.be.called;
            done();
        });
    });
});
