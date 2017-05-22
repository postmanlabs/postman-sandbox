describe('timers inside sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib'),
        ctx;


    it('must work inside sandbox', function (done) {
        Sandbox.createContext({
            debug: false
        }, function (err, ctx) {
            var consoleEventArgs;

            if (err) { return done(err); }

            ctx.on('error', done);

            ctx.execute(`
                var startTime = Date.now();
                setTimeout(function () {
                    pm.globals.set('timeout', Date.now() - startTime, 'number');
                }, 100);
            `, {
            }, function (err, res) {
                if (err) { return done(err); }
                expect(err).to.not.be.ok();
                expect(res).to.have.property('globals');
                expect(res.globals.values).to.be.an('array');
                expect(res.globals.values[0].value).to.be.greaterThan(99);
                done();
            });
        });
    });
});
