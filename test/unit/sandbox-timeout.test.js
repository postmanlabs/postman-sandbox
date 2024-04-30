describe('sandbox timeout', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should accept a timeout option', function (done) {
        Sandbox.createContext({
            timeout: 10000 // 10 seconds
        }, function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.ping(function (err, ttl, packet) {
                expect(err).to.be.null;
                expect(packet).to.be.ok;
                expect(ttl).be.a('number').that.is.above(-1);
                done();
            });
        });
    });

    it('should timeout on infinite loop', function (done) {
        Sandbox.createContext({
            timeout: 500 // 500 ms
        }, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);

            ctx.execute('while(1);', function (err) {
                expect(err).to.be.ok;
                expect(err).to.have.property('message', 'sandbox not responding');
                done();
            });
        });
    });

    it('should not timeout if code is error-free', function (done) {
        Sandbox.createContext({
            timeout: 500 // 500 ms
        }, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);
            ctx.on('execution.error', done);
            ctx.on('execution.result.1', (err) => {
                expect(err).to.be.null;
            });
            ctx.execute('var x = "i am doing nothing!";', { id: '1' }, done);
        });
    });

    it('should clear timeout on bridge disconnect', function (done) {
        Sandbox.createContext({
            timeout: 500 // 500 ms
        }, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);

            ctx.execute('while(1)', { id: '1' }, function (err) {
                expect(err).to.be.ok;
                expect(err).to.have.property('message');
                ctx.once('execution.result.1', (err) => {
                    expect(err).to.be.ok;
                    expect(err).to.have.property('message');
                    expect(err).to.have.property('message', 'sandbox not responding');

                    ctx.once('execution.result.1', (err) => {
                        expect(err).to.be.ok;
                        expect(err).to.have.property('message');
                        expect(err).to.have.property('message', 'sandbox: execution interrupted, ' +
                            'bridge disconnecting.');
                    });
                });
                done();
            });
            ctx.dispose();
        });
    });


    it('should reconnect on execute after a timeout', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);
            ctx.on('console', (...args) => {
                expect(args).to.be.ok;
                expect(args[2]).to.equal('knock knock');
            });

            ctx.execute('while(1);', { id: '1', timeout: 500 }, (err) => {
                expect(err).to.be.ok;
                expect(err).to.have.property('message', 'sandbox not responding');

                ctx.execute('console.log("knock knock")', { id: '2' }, done);
            });
        });
    });

    it('should retain init and connect options on reconnect', function (done) {
        Sandbox.createContextFleet({
            grpc: `
                function initializeExecution () {
                    return {
                        request: {
                            type: 'grpc-request'
                        },
                        response: {
                            type: 'grpc-response'
                        }
                    }
                };

                function chaiPlugin (chai) {
                    const Assertion = chai.Assertion;

                    Assertion.addProperty('grpcRequest', function () {
                      this.assert(this._obj.type === 'grpc-request',
                        'expecting a gRPC request but got #{this}',
                        'not expecting a gRPC request object');
                    });

                    Assertion.addProperty('grpcResponse', function () {
                        this.assert(this._obj.type === 'grpc-response',
                          'expecting a gRPC response but got #{this}',
                          'not expecting a gRPC response object');
                      });
                }

                module.exports = { initializeExecution, chaiPlugin };
            `,
            websocket: ''
        }, {}, { timeout: 500 }, (err, fleet) => {
            if (err) { return done(err); }

            fleet.getContext('grpc', (err, ctx) => {
                if (err) { return done(err); }

                ctx.on('error', done);
                ctx.on('execution.assertion', (_, assertions) => {
                    assertions.forEach((a) => {
                        expect(a.passed).to.be.true;
                    });
                });

                ctx.execute('while(1);', () => {
                    ctx.execute(`
                        pm.test('Should be gRPC request and response', () => {
                            pm.request.to.be.grpcRequest;
                            pm.response.to.be.grpcResponse;
                        });
                        while(1);
                    `, (err) => {
                        expect(err).to.be.ok;
                        expect(err).to.have.property('message', 'sandbox not responding');
                        done();
                    });
                });
            });
        });
    });
});
