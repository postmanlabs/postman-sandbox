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
            expect(consoleSpy.firstCall.args[2]).to.equal('Using "data" is deprecated. Use "pm.iterationData" instead.');
            done();
        });
    });

    it('should show a warning on using legacy functions', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
            atob('a');
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledOnce;
            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2]).to.equal('Using "atob" is deprecated. Use "require(\'atob\')" instead.');
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
            expect(consoleSpy.firstCall.args[2]).to.equal('Using "data" is deprecated. Use "pm.iterationData" instead.');
            expect(consoleSpy.secondCall.args[1]).to.equal('warn');
            expect(consoleSpy.secondCall.args[2]).to.equal('Using "environment" is deprecated. Use "pm.environment" instead.');
            done();
        });
    });

    it('should have special handling for postman.setNextRequest', function (done) {
        const consoleSpy = sinon.spy();

        context.on('console', consoleSpy);
        context.execute(`
            postman.setNextRequest('abc');
        `, function (err) {
            if (err) {
                return done(err);
            }

            expect(consoleSpy).to.be.calledOnce;
            expect(consoleSpy.firstCall.args[1]).to.equal('warn');
            expect(consoleSpy.firstCall.args[2])
                .to.equal('Using "postman.setNextRequest" is deprecated. Use "pm.execution.setNextRequest()" instead.');
            done();
        });
    });
});
