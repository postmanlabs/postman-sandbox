var _expect;

before(function () {
    global.expect && (_expect = global.expect);
    global.expect = require('chai').expect;
});

after(function () {
    _expect ? (global.expect = _expect) : (delete global._expect);
    _expect = null;
});

describe('_bootstrap', function () {
    this.timeout(1000 * 60); // set a timeout

    var Sandbox = require('../../lib');
    it('bundling should work for sandbox', function (done) {
        // we simply create a context and run to ensure it is working
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);
            ctx.ping(done);
        });
    });
});
