var Sandbox = require('../../lib'),
    Execution = require('../../lib/sandbox/execution'),

    execution, // eslint-disable-line no-unused-vars
    ctx;

describe('pm.variables', function () {
    this.timeout(1000 * 60);

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

    before(function () {
        execution = new Execution('id', {listen: 'test'}, {}, {});
    });

    it('set variables must be returned back in the result', function (done) {
        ctx.execute('pm.variables.set("user", "postman");', {
            debug: false,
            timeout: 200
        }, function (err, execution) {
            if (err) { return done(err); }

            expect(execution._variables).to.have.property('values');
            expect(execution._variables.values).to.eql([{type: 'any', value: 'postman', key: 'user'}]);
            return done();
        });
    });

});
