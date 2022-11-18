const { expect } = require('chai');

describe('promises inside sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should set the execution to return async when a completed microtask includes a timer', function (done) {
        Sandbox.createContext({ debug: false }, function (err, ctx) {
            if (err) {
                return done(err);
            }

            var executionError = sinon.spy();

            ctx.on('execution.error', executionError);

            ctx.execute(`
                const message = new Promise((resolve) => {
                    resolve("test");
                });
                message.then((result) => {
                    setImmediate(() => { });
                });
            `,
            function (err, res) {
                if (err) {
                    return done(err);
                }

                expect(res).to.nested.include({
                    'return.async': true
                });

                expect(executionError).to.not.have.been.called;

                done();
            });
        });
    });

    it('should set the execution to return non-async when a completed microtask has no timer', function (done) {
        Sandbox.createContext({ debug: false }, function (err, ctx) {
            if (err) {
                return done(err);
            }

            var executionError = sinon.spy();

            ctx.on('execution.error', executionError);

            ctx.execute(`
                const message = new Promise((resolve) => {
                    resolve("test");
                });
                message.then((msg) => {
                    console.log(msg);
                });
            `,
            function (err, res) {
                if (err) {
                    return done(err);
                }

                expect(res).to.nested.include({
                    'return.async': false
                });

                expect(executionError).to.not.have.been.called;

                done();
            });
        });
    });

    it('should call assertions once resolved', function (done) {
        Sandbox.createContext({ debug: false }, function (err, ctx) {
            if (err) {
                return done(err);
            }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`
                pm.test('one test', function (done) {
                    const message = new Promise((resolve) => {
                        resolve();
                    });
                    message.then((result) => {
                        return new Promise((resolve) => {
                            setImmediate(() => resolve());
                        })
                    }).then(() => {
                        done();
                    });
                });
            `,
            function (err, res) {
                if (err) {
                    return done(err);
                }

                expect(res).to.nested.include({
                    'return.async': true
                });

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

    it('should terminate script ' +
        'if async done is not called in a Promise', function (done) {
        Sandbox.createContext({ debug: false }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`
                pm.test('one test', function (done) {
                    Promise.resolve(42).then(function () {
                        // done not called
                    });
                });
            `, function (err, res) {
                if (err) { return done(err); }

                expect(res).to.nested.include({
                    'return.async': false
                });
                expect(executionError).to.not.have.been.called;
                expect(executionAssertion).to.not.have.been.called;
                expect(err).to.be.null; // no error

                done();
            });
        });
    });

    it('should forward errors from a Promise', function (done) {
        Sandbox.createContext({ debug: false }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`
                pm.test('one test', function (done) {
                    Promise.resolve('Catch me if you can').then((msg) => {
                        setImmediate(() => {
                            done(new Error(msg))
                        });
                    })
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

    it('should forward synchronous ' +
        'errors from asynchronous Promise tests', function (done) {
        Sandbox.createContext({ debug: false }, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                executionAssertion = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.assertion', executionAssertion);

            ctx.execute(`
                pm.test('one test', function (done) {
                    new Promise((resolve) => {
                        resolve('Catch me if you can');
                    }).then((msg) => {
                        setImmediate(() => {
                            done(new Error(msg));
                        });
                    })

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

    it('runs consecutive Promises when an async function executes in a microtask queue', function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                onConsole = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('console', onConsole);

            ctx.execute(`
                const foo = () => new Promise((resolve) => {
                    console.log('foo');
                    setTimeout(resolve, 200);
                });

                const bar = () => new Promise((resolve) => {
                    console.log('bar');
                    resolve();
                });

                const baz = () => new Promise((resolve) => {
                    console.log('baz');
                    resolve();
                });

                Promise.resolve()
                    .then(() => foo())
                    .then(() => bar())
                    .then(() => baz());
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(onConsole).to.have.callCount(3);
                done();
            });
        });
    });

    it('runs consecutive Promises when an async function executes in a microtask queue (async/await)', function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            if (err) { return done(err); }

            var executionError = sinon.spy(),
                onConsole = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('console', onConsole);

            ctx.execute(`
                const foo = () => new Promise((resolve) => {
                    console.log('foo');
                    setTimeout(resolve, 200);
                });

                const bar = () => new Promise((resolve) => {
                    console.log('bar');
                    resolve();
                });

                const baz = () => new Promise((resolve) => {
                    console.log('baz');
                    resolve();
                });

                (async function main() {
                  await Promise.resolve()
                  await foo();
                  await bar();
                  await baz();
                })();
            `, function (err) {
                if (err) { return done(err); }

                expect(executionError).to.not.have.been.called;
                expect(onConsole).to.have.callCount(3);
                done();
            });
        });
    });
});
