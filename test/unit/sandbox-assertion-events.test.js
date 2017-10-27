describe('sandbox assertion events', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib'),
        assestions = [];

    before(function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('execution.assertions', function (cursor, results) {
                assestions = assestions.concat(results);
            });

            ctx.execute(`
                pm.test("pass1", function () {
                    pm.expect(123).be.a('number');
                });

                tests['fail1'] = undefined;

                pm.test("fail2", function () {
                    throw new Error('sample error');
                });

                tests['pass2'] = true;
            `, {}, function (err) {
                    if (err) { return done(err); }
                    done();
                }
            );
        });
    });

    it('must be indexed starting from zero', function () {
        expect(assestions.map(function (test) { return test.index; })).to.eql([0, 1, 2, 3]);
    });

    it('must be called for async and sync assertions', function () {
        expect(assestions.length).to.be(4);

        // async tests assertions in order
        expect(assestions[0]).to.have.property('name', 'pass1');
        expect(assestions[0]).to.have.property('passed', true);
        expect(assestions[1]).to.have.property('name', 'fail2');
        expect(assestions[1]).to.have.property('passed', false);

        // sync tests assestions in order
        expect(assestions[2]).to.have.property('name', 'fail1');
        expect(assestions[2]).to.have.property('passed', false);
        expect(assestions[3]).to.have.property('name', 'pass2');
        expect(assestions[3]).to.have.property('passed', true);
    });
});
