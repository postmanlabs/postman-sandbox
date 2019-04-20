describe('sandbox test assertion', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should call the assertion event with no name', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test(function () {
                    // doing nothing
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                done();
            });
        });
    });

    it('should call the assertion event with name', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function () {
                    // doing nothing
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);

                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.include({
                        name: 'one test'
                    });
                done();
            });
        });
    });

    it('should call the assertion event on async test', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    setTimeout(function () {
                        done();
                    }, 500);
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.include({
                        name: 'one test',
                        async: true
                    });

                done();
            });
        });
    });

    it('should call the assertion event on skipped test', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test.skip('one test', function () {
                    // do nothing
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.include({
                        name: 'one test',
                        skipped: true
                    });

                done();
            });
        });
    });
});
