(typeof window === 'undefined' ? describe : describe.skip)('sandbox timeout', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must accept a timeout option', function (done) {
        Sandbox.createContext({
            timeout: 10000 // 10 seconds
        }, function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.ping(function (err, ttl, packet) {
                expect(err).to.not.be.ok();
                expect(packet).to.be.ok();
                expect(ttl).be.a('number');
                expect(ttl >= 0).be.ok();
                done();
            });
        });
    });

    it('must timeout on infinite loop', function (done) {
        Sandbox.createContext({
            timeout: 500 // 500 ms
        }, function (err, ctx) {
            if (err) { return done(err); }

            var errorEventData;
            ctx.on('error', function (err) {
                errorEventData = err;
            });

            ctx.execute('while(1)', function (err) {
                expect(err).be.ok();
                expect(err).have.property('message', 'sandbox: execution timeout');

                expect(errorEventData).be.ok();
                expect(errorEventData).have.property('message', 'Script execution timed out.');
                done();
            });
        });
    });

    it('must not timeout if code is error-free', function (done) {
        Sandbox.createContext({
            timeout: 500 // 500 ms
        }, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('error', done);
            ctx.execute('var x = "i am doing nothing!";', done);
        });
    });
});
