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

                if (contextsExecuted === 2 && !doneCalled) {
                    doneCalled = true;
                    return done();
                }
            };

            ctx.execute(`
                pm.test("pass1", function () {
                    pm.expect(123).to.be.a('number');
                });

                tests['fail2'] = undefined;

                pm.test("fail1", function () {
                    throw new Error('sample error 1');
                });

                tests['pass2'] = true;
            `, {}, callback);

            ctx.execute(`
                pm.test("pass3", function () {
                    pm.expect(123).to.be.a('number');
                });

                tests['fail5'] = undefined;
                tests['fail6'] = false;

                pm.test("fail3", function () {
                    throw new Error('sample error 2');
                });

                pm.test("fail4", function () {
                    pm.expect('a').to.equal('b');
                });

                tests['pass4'] = true;
            `, {}, callback);
        });
    });

    it('should be indexed across parallel executions', function () {
        expect(assestions.map(function (test) { return test.index; })).to.eql([0, 1, 2, 3, 0, 1, 2, 3, 4, 5]);
    });

    it('should be called for async and sync assertions', function () {
        expect(assestions.length).to.equal(10);

        // async tests assertions for 1st execution in order
        expect(assestions[0]).to.deep.include({
            name: 'pass1',
            passed: true,
            error: null
        });
        expect(assestions[1]).to.deep.include({
            name: 'fail1',
            passed: false,
            error: {
                type: 'Error',
                name: 'Error',
                message: 'sample error 1'
            }
        });

        // sync tests assestions for 1st execution in order
        expect(assestions[2]).to.deep.nested.include({
            name: 'fail2',
            passed: false,
            'error.name': 'AssertionError',
            'error.message': 'expected undefined to be truthy'
        });
        expect(assestions[3]).to.deep.include({
            name: 'pass2',
            passed: true,
            error: null
        });

        // async tests assertions for 2nd execution in order
        expect(assestions[4]).to.deep.include({
            name: 'pass3',
            passed: true,
            error: null
        });
        expect(assestions[5]).to.deep.nested.include({
            name: 'fail3',
            passed: false,
            'error.name': 'Error',
            'error.message': 'sample error 2'
        });
        expect(assestions[6]).to.deep.nested.include({
            name: 'fail4',
            passed: false,
            'error.name': 'AssertionError',
            'error.message': 'expected \'a\' to equal \'b\''
        });

        // sync tests assestions for 2nd execution in order
        expect(assestions[7]).to.deep.nested.include({
            name: 'fail5',
            passed: false,
            'error.name': 'AssertionError',
            'error.message': 'expected undefined to be truthy'
        });
        expect(assestions[8]).to.deep.nested.include({
            name: 'fail6',
            passed: false,
            'error.name': 'AssertionError',
            'error.message': 'expected false to be truthy'
        });
        expect(assestions[9]).to.deep.include({
            name: 'pass4',
            passed: true,
            error: null
        });
    });
});
