(typeof window !== 'undefined' ? describe : describe.skip)('sandbox in browser', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must have a few important globals', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                var assert = require('assert');
                assert.equal(typeof window, 'object');
                assert.equal(typeof document, 'object');
            `, done);
        });
    });
});
