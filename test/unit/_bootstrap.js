var chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),

    _expect,
    _sinon;

chai.use(sinonChai);

before(function () {
    global.expect && (_expect = global.expect);
    global.expect = chai.expect;

    global.sinon && (_sinon = global.sinon);
    global.sinon = sinon;
});

after(function () {
    _expect ? (global.expect = _expect) : (delete global.expect);
    _expect = null;

    _sinon ? (global.sinon = _sinon) : (delete global.sinon);
    _sinon = null;
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
