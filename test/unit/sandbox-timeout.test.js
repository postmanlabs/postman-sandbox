(typeof window === 'undefined' ? describe : describe.skip)('sandbox timeout', function () {
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

            ctx.on('error', function () { }); // eslint-disable-line no-empty-function

            ctx.execute('while(1)', function (err) {
                expect(err).to.be.ok;
                expect(err).to.have.property('message', 'sandbox: synchronous script execution timeout');
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
            ctx.execute('var x = "i am doing nothing!";', done);
        });
    });

    it('should not allow setting timeout more that a limit', function (done) {
        Sandbox.createContext({
            timeout: 10 * 60 * 1000 // 10 minutes
        }, function (err, ctx) {
            expect(err).to.not.exist;
            expect(ctx.executionTimeout).to.equal(5 * 60 * 1000); // 5 minutes
            done();
        });
    });

    it('should clear timeout on bridge disconnect', function (done) {
        Sandbox.createContext({
            debug: true,
            timeout: 500 // 500 ms
        }, function (err, ctx) {
            if (err) { return done(err); }

            // @todo once async execution comes into play, this should not even be triggered
            // @todo fix a race condition where this error swaps between "Script execution timed out." and
            //  "sandbox: execution interrupted, bridge disconnecting."
            ctx.on('error', function () { }); // eslint-disable-line no-empty-function

            ctx.execute('while(1)', function (err) {
                expect(err).to.be.ok;
                expect(err).to.have.property('message', 'sandbox: execution interrupted, bridge disconnecting.');
                done();
            });
            ctx.dispose();
        });
    });
});
