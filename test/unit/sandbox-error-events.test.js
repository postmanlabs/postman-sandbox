describe('sandbox error events', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should throw generic execution.error event on error', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('execution.error', function (cursor, err) {
                expect(cursor).to.have.property('execution', 'my-execution-id');
                expect(err).to.have.property('message', 'this will regurgitate!');
                done();
            });

            ctx.execute('throw new Error("this will regurgitate!")', {
                id: 'my-execution-id'
            }, function () {}); // eslint-disable-line no-empty-function
        });
    });

    it('should throw execution specific execution.error.:id event on error', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('execution.error.my-execution-id', function (cursor, err) {
                expect(cursor).to.have.property('execution', 'my-execution-id');
                expect(err).to.have.property('message', 'this will regurgitate!');
                done();
            });

            ctx.execute('throw new Error("this will regurgitate!")', {
                id: 'my-execution-id'
            }, function () {}); // eslint-disable-line no-empty-function
        });
    });

    it('should forward unhandled promise rejection errors', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            const executionError = sinon.spy(),
                executionErrorSpecific = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.error.exec-id', executionErrorSpecific);

            ctx.execute(`
                async function makeMeThrow () {
                    await Promise.reject(new Error('catch me if you can'));
                }

                makeMeThrow();
            `, { id: 'exec-id' }, function (err) {
                expect(err).to.be.null;

                expect(executionError).to.have.been.calledOnce;
                expect(executionErrorSpecific).to.have.been.calledOnce;

                expect(executionError.args[0][0]).to.be.an('object').and.have.property('execution', 'exec-id');
                expect(executionError.args[0][1]).to.be.an('object')
                    .and.have.property('message', 'catch me if you can');

                expect(executionErrorSpecific.args[0][0]).to.be.an('object').and.have.property('execution', 'exec-id');
                expect(executionErrorSpecific.args[0][1]).to.be.an('object')
                    .and.have.property('message', 'catch me if you can');

                done();
            });
        });
    });

    it('should forward errors from top level await', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            const executionError = sinon.spy(),
                executionErrorSpecific = sinon.spy();

            ctx.on('execution.error', executionError);
            ctx.on('execution.error.exec-id', executionErrorSpecific);
            ctx.on('error', done);

            ctx.execute(`
                async function makeMeThrow () {
                    return Promise.reject(new Error('catch me if you can'));
                }

                await makeMeThrow();
            `, { id: 'exec-id' }, function (err) {
                expect(err).to.be.an('object').and.have.property('message', 'catch me if you can');

                expect(executionError).to.have.been.calledOnce;
                expect(executionErrorSpecific).to.have.been.calledOnce;

                expect(executionError.args[0][0]).to.be.an('object').and.have.property('execution', 'exec-id');
                expect(executionError.args[0][1]).to.be.an('object')
                    .and.have.property('message', 'catch me if you can');

                expect(executionErrorSpecific.args[0][0]).to.be.an('object').and.have.property('execution', 'exec-id');
                expect(executionErrorSpecific.args[0][1]).to.be.an('object')
                    .and.have.property('message', 'catch me if you can');

                done();
            });
        });
    });
});
