describe('sandbox disposal', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must work', function (done) {
        Sandbox.createContext({debug: false}, function (err, context) {
            if (err) { return done(err); }
            context.on('error', done);

            var status = {
                started: false,
                disconnected: false,
                misfiredTimer: false
            };

            context.on('console', function (cur, lvl, msg) {
                switch (msg) {
                    case 'started':
                        status.started = true;

                        setTimeout(context.dispose.bind(context), 1);
                        setTimeout(function () {
                            expect(status).to.have.property('started', true);
                            expect(status).to.have.property('disconnected', true);
                            expect(status).to.have.property('misfiredTimer', false);
                            done();
                        }, 100);
                        break;

                    case 'timeout':
                        status.misfiredTimer = true;
                        done(new Error('expected sandbox timeout to be cleared'));
                        break;

                    default:
                        done(new Error('unexpected console communication from sandbox'));
                }
            });

            context.execute(`
                console.log('started');

                setTimeout(function () {
                    console.log('timeout');
                }, 50);
            `, {
                timeout: 1000
            }, function (err) {
                status.disconnected = true;
                expect(err).to.have.property('message', 'sandbox: execution interrupted, bridge disconnecting.');
            });
        });
    });
});
