describe('sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must create context', function (done) {
        Sandbox.createContext(function (err, ctx) {

            if (err) {
                return done(err);
            }

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

    it.skip('must execute a piece of code', function (done) {
        Sandbox.createContext(function (err, ctx) {

            if (err) {
                return done(err);
            }

            ctx.on('error', done);

            ctx.ping(function (err, packet) {
                expect(err).to.not.be.ok();
                expect(packet).to.be.ok();
                done();
            });
        });
    });
});
