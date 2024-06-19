describe('script in sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should retain global variables in subsequent calls', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);

            ctx.execute(`
                var assert = require('assert');

                // check absence of a global var on first run
                assert.equal(typeof oneGlobalVariable, 'undefined', 'oneGlobalVariable should be undefined at first');

                // set a global variable
                oneGlobalVariable = 'test-global-variable';
            `, function (err) {
                if (err) { return done(err); }

                ctx.execute(`
                    var assert = require('assert');
                    assert.notEqual(typeof oneGlobalVariable, 'undefined', 'oneGlobalVariable should be defined');
                    assert.equal(oneGlobalVariable, 'test-global-variable', 'oneGlobalVariable should have value');
                `, done);
            });
        });
    });

    it('should be able to define variables with names matching legacy globals', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }
            ctx.on('error', done);
            ctx.on('execution.error', done);

            ctx.execute('const data = 1;', done);
        });
    });
});
