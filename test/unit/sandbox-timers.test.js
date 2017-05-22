describe('timers inside sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib'),
        ctx;

    beforeEach(function (done) {
        Sandbox.createContext({debug: true}, function (err, context) {
            if (err) { return done(err); }
            ctx = context;
            done();
        });
    });

    afterEach(function () {
        ctx.dispose();
        ctx = null;
    });


    it('must work inside sandbox', function (done) {
        ctx.execute(`
            var startTime = Date.now();
            setTimeout(function () {
                pm.globals.set('timeout', Date.now() - startTime, 'number');
            }, 100);
        `, {
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }

            expect(err).to.not.be.ok();
            expect(res.return.async).to.be(true);

            expect(res).to.have.property('globals');
            expect(res.globals.values).to.be.an('array');
            expect(res.globals.values[0].value).to.be.greaterThan(99);
            done();
        });
    });

    it('must time out if timers run beyond interval', function (done) {
        var count = {
            terminal: null,
            current: 0
        };

        ctx.on('console', function (cursor, level, message) { // keep track of intervals passed
            if (message === 'interval') { count.current++; }
        });

        ctx.execute(`
            var startTime = Date.now();
            setInterval(function () {
                console.log('interval')
            }, 50);
        `, {
            debug: false,
            timeout: 125
        }, function (err, res) {
            count.terminal = count.current;

            expect(err).to.have.property('name', 'Error');
            expect(err).to.have.property('message', 'sandbox: asyncronous script execution timeout');
            expect(res.return.async).to.be(true);

            // now wait for a while to ensure no extra interval timers were fired
            setTimeout(function () {
                expect(count).to.have.property('current', count.terminal);
                done();
            }, 250);
        });
    });
});
