var sdk = require('postman-collection'),

    Sandbox = require('../../lib'),
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

    it('must return only the base definition variables in the result', function (done) {
        var globalVarList = new sdk.VariableList(null, {key: 'key-1', value: 'value-1'}),
            envVarList = new sdk.VariableList(null, {key: 'key-2', value: 'value-2'});

        ctx.execute('pm.variables.set("key-3", "value-3");', {
            timeout: 200,
            context: {
                globals: new sdk.VariableScope(globalVarList),
                environment: new sdk.VariableScope(envVarList)
            }
        }, function (err, execution) {
            if (err) { return done(err); }

            expect(execution.variables).to.have.property('values');
            expect(execution.variables.values).to.eql([{type: 'any', value: 'value-3', key: 'key-3'}]);
            return done();
        });
    });

});
