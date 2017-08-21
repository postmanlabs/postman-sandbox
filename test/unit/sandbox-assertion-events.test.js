describe('sandbox assertion events', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must be indexed starting from zero', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            var indices = [];

            ctx.on('execution.assertion', function (cursor, result) {
                indices.push(result.index);
            });

            ctx.execute(`
                pm.test("pass1", function () {
                    pm.expect(123).be.a(Number);
                });

                pm.test("pass2", function () {
                    pm.expect(123).be.a(Number);
                });
            `, {id: 'my-execution-id'}, function (err) {
                    if (err) { return done(err); }

                    expect(indices).to.eql([0, 1]);

                    done();
                });
        });
    });
});
