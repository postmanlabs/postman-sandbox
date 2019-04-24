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
                        name: 'one test',
                        passed: true
                    });
                done();
            });
        });
    });

    it('should contain synchronous script errors within test', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function () {
                    throw new Error('Catch me if you can');
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.deep.include({
                        passed: false,
                        error: {
                            type: 'Error',
                            name: 'Error',
                            message: 'Catch me if you can'
                        }
                    });
                done();
            });
        });
    });

    (typeof window === 'undefined' ? it : it.skip)('should call the assertion event on async test', function (done) {
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
                    }, 10);
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.include({
                        passed: true,
                        async: true
                    });

                done();
            });
        });
    });

    (typeof window === 'undefined' ? it : it.skip)('should not wait if async done is not called', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    // done is not called
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.not.have.been.called;
                expect(err).to.be.null; // no error

                done();
            });
        });
    });

    (typeof window === 'undefined' ? it : it.skip)('should terminate script ' +
        'if async done is not called in an async script', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    setTimeout(function () {
                        // done not called
                    }, 10)
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.not.have.been.called;
                expect(err).to.be.null; // no error

                done();
            });
        });
    });

    (typeof window === 'undefined' ? it : it.skip)('should forward errors from asynchronous callback', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    setTimeout(function () {
                        done(new Error('Catch me if you can'));
                    }, 10);
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.deep.include({
                        passed: false,
                        async: true,
                        error: {
                            type: 'Error',
                            name: 'Error',
                            message: 'Catch me if you can'
                        }
                    });
                done();
            });
        });
    });

    (typeof window === 'undefined' ? it : it.skip)('should forward synchronous' +
        'errors from asynchronous tests', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`"use sandbox2";
                pm.test('one test', function (done) {
                    setTimeout(function () {
                        done(new Error('Catch me if you can'));
                    }, 10);

                    throw new Error('there is no right way to do something wrong');
                });
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.have.been.calledOnce;

                expect(executionAssertion.args[0][0]).to.be.an('object').and.have.property('execution');
                expect(executionAssertion.args[0][1]).to.be.an('array').and.have.property('length', 1);
                expect(executionAssertion.args[0][1][0]).to.be.an('object')
                    .and.deep.include({
                        passed: false,
                        async: true,
                        error: {
                            type: 'Error',
                            name: 'Error',
                            message: 'there is no right way to do something wrong'
                        }
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
