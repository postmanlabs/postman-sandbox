describe('legacy execute', function () {
    this.timeout(1000 * 60);

    var Sandbox = require('../../lib');

    it('must replace `undefined` test values with `false`', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                tests['undefined'] = undefined;
                tests['true'] = true;
                tests['false'] = false;
            `, {
                globals: {tests: {}}
            }, function (err, result) {
                if (err) { return done(err); }

                expect(result).to.eql({
                    // ensure that tests.undefined is set to false, instead of "undefined".
                    globals: {tests: {undefined: false, true: true, false: false}}, debug: false
                });
                done();
            });
        });
    });
});
