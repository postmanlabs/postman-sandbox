describe('sandbox assertion events', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib'),
        assestions = [];

    before(function (done) {
        var contextsExecuted = 0,
            doneCalled = false;

        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('execution.assertion', function (cursor, results) {
                assestions = assestions.concat(results);
            });

            var callback = function (err) {
                contextsExecuted++;

                if (err && !doneCalled) {
                    doneCalled = true;
                    return done(err);
                }

                if (contextsExecuted === 2) {
                    doneCalled = true;
                    return done();
                }
            };

            ctx.execute(`
                pm.test("pass1", function () {
                    pm.expect(123).be.a('number');
                });

                tests['fail2'] = undefined;

                pm.test("fail1", function () {
                    throw new Error('sample error 1');
                });

                tests['pass2'] = true;
            `, {}, callback);

            ctx.execute(`
                pm.test("pass3", function () {
                    pm.expect(123).be.a('number');
                });

                tests['fail4'] = undefined;

                pm.test("fail3", function () {
                    throw new Error('sample error 2');
                });

                tests['pass4'] = true;
            `, {}, callback);
        });
    });

    it('must be indexed across parallel executions', function () {
        expect(assestions.map(function (test) { return test.index; })).to.eql([0, 1, 2, 3, 0, 1, 2, 3]);
    });

    it('must be called for async and sync assertions', function () {
        expect(assestions.length).to.be(8);

        // async tests assertions for 1st execution in order
        expect(assestions[0]).to.have.property('name', 'pass1');
        expect(assestions[0]).to.have.property('passed', true);
        expect(assestions[1]).to.have.property('name', 'fail1');
        expect(assestions[1]).to.have.property('passed', false);

        // sync tests assestions for 1st execution in order
        expect(assestions[2]).to.have.property('name', 'fail2');
        expect(assestions[2]).to.have.property('passed', false);
        expect(assestions[3]).to.have.property('name', 'pass2');
        expect(assestions[3]).to.have.property('passed', true);

        // async tests assertions for 2nd execution in order
        expect(assestions[4]).to.have.property('name', 'pass3');
        expect(assestions[4]).to.have.property('passed', true);
        expect(assestions[5]).to.have.property('name', 'fail3');
        expect(assestions[5]).to.have.property('passed', false);

        // sync tests assestions for 2nd execution in order
        expect(assestions[6]).to.have.property('name', 'fail4');
        expect(assestions[6]).to.have.property('passed', false);
        expect(assestions[7]).to.have.property('name', 'pass4');
        expect(assestions[7]).to.have.property('passed', true);
    });
});
