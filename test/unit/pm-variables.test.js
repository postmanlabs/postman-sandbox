var sdk = require('postman-collection'),

    Sandbox = require('../../lib'),

    globalVarList = new sdk.VariableList(null, {key: 'key-1', value: 'value-1'}),
    collectionVarList = new sdk.VariableList(null, {key: 'key-2', value: 'value-2'}),
    envVarList = new sdk.VariableList(null, {key: 'key-3', value: 'value-3'}),
    contextData = {'key-4': 'value-4'},
    localVarList = new sdk.VariableList(null, {key: 'key-5', value: 'value-5'}),
    ctx,
    executionResults;

describe('pm.variables', function () {
    this.timeout(1000 * 60);

    before(function (done) {
        Sandbox.createContext({debug: true}, function (err, context) {
            if (err) { return done(err); }
            ctx = context;
            done();
        });
    });

    after(function () {
        ctx.dispose();
        ctx = null;
    });

    it('should be an instance of VariableScope', function (done) {
        ctx.execute(`
            var assert = require('assert'),
                VariableScope = require('postman-collection').VariableScope;
            assert.strictEqual(VariableScope.isVariableScope(pm.variables), true);
        `, done);
    });

    describe('.set', function () {
        before(function (done) {
            ctx.execute(`
                pm.variables.set("key-1", "modified");
                pm.variables.set("key-2", "modified");
                pm.variables.set("key-3", "modified");
                pm.variables.set("key-4", "modified");
                pm.variables.set("key-5", "modified");
                pm.variables.set("key-6", "new");
            `, {
                    timeout: 200,
                    context: {
                        globals: new sdk.VariableScope(globalVarList),
                        collectionVariables: new sdk.VariableScope(collectionVarList),
                        environment: new sdk.VariableScope(envVarList),
                        data: contextData,
                        variables: new sdk.VariableScope(localVarList)
                    }
                }, function (err, execution) {
                    if (err) { return done(err); }

                    executionResults = execution;
                    return done();
                });
        });

        it('must return the modified variables in the result', function () {
            expect(executionResults.variables).to.have.property('values');
            expect(executionResults.variables.values).to.eql([
                {type: 'any', value: 'modified', key: 'key-5'},
                {type: 'any', value: 'modified', key: 'key-1'},
                {type: 'any', value: 'modified', key: 'key-2'},
                {type: 'any', value: 'modified', key: 'key-3'},
                {type: 'any', value: 'modified', key: 'key-4'},
                {type: 'any', value: 'new', key: 'key-6'}
            ]);
        });

        it('must not modify the globals, envrironment, collection and data variables', function () {
            expect(executionResults.globals).to.have.property('values');
            expect(executionResults.collectionVariables).to.have.property('values');
            expect(executionResults.environment).to.have.property('values');

            expect(executionResults.globals.values).to.eql([
                {type: 'any', value: 'value-1', key: 'key-1'}
            ]);
            expect(executionResults.collectionVariables.values).to.eql([
                {type: 'any', value: 'value-2', key: 'key-2'}
            ]);
            expect(executionResults.environment.values).to.eql([
                {type: 'any', value: 'value-3', key: 'key-3'}
            ]);
            expect(executionResults.data).to.eql({'key-4': 'value-4'});
        });
    });

    describe('.get', function () {
        it('should honour the precendence', function (done) {
            var globalVarList = new sdk.VariableList(null, [
                    {key: 'key-1', value: 'value-1'},
                    {key: 'key-2', value: 'value-1'},
                    {key: 'key-3', value: 'value-1'},
                    {key: 'key-4', value: 'value-1'},
                    {key: 'key-5', value: 'value-1'}
                ]),
                collectionVarList = new sdk.VariableList(null, [
                    {key: 'key-2', value: 'value-2'},
                    {key: 'key-3', value: 'value-2'},
                    {key: 'key-4', value: 'value-2'},
                    {key: 'key-5', value: 'value-2'}
                ]),
                envVarList = new sdk.VariableList(null, [
                    {key: 'key-3', value: 'value-3'},
                    {key: 'key-4', value: 'value-3'},
                    {key: 'key-5', value: 'value-3'}
                ]),
                contextData = {
                    'key-4': 'value-4',
                    'key-5': 'value-4'
                },
                localVarList = new sdk.VariableList(null, {key: 'key-5', value: 'value-5'});

            ctx.execute(`
                var assert = require('assert');

                assert.deepEqual(pm.variables.toObject(), {
                    'key-1': 'value-1',
                    'key-2': 'value-2',
                    'key-3': 'value-3',
                    'key-4': 'value-4',
                    'key-5': 'value-5'
                });
                assert.strictEqual(pm.variables.get('key-1'), 'value-1');
                assert.strictEqual(pm.variables.get('key-2'), 'value-2');
                assert.strictEqual(pm.variables.get('key-3'), 'value-3');
                assert.strictEqual(pm.variables.get('key-4'), 'value-4');
                assert.strictEqual(pm.variables.get('key-5'), 'value-5');
            `, {
                    timeout: 200,
                    context: {
                        globals: new sdk.VariableScope(globalVarList),
                        collectionVariables: new sdk.VariableScope(collectionVarList),
                        environment: new sdk.VariableScope(envVarList),
                        data: contextData,
                        variables: new sdk.VariableScope(localVarList)
                    }
                }, function (err, execution) {
                    if (err) { return done(err); }

                    executionResults = execution;
                    return done();
                });
        });

        it('must return appropriate variables', function (done) {
            ctx.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.variables.get('key-1'), 'value-1');
                assert.strictEqual(pm.variables.get('key-2'), 'value-2');
                assert.strictEqual(pm.variables.get('key-3'), 'value-3');
                assert.strictEqual(pm.variables.get('key-4'), 'value-4');
                assert.strictEqual(pm.variables.get('key-5'), 'value-5');
                assert.strictEqual(pm.variables.get('key-6'), undefined);
            `, {
                    timeout: 200,
                    context: {
                        globals: new sdk.VariableScope(globalVarList),
                        collectionVariables: new sdk.VariableScope(collectionVarList),
                        environment: new sdk.VariableScope(envVarList),
                        data: contextData,
                        variables: new sdk.VariableScope(localVarList)
                    }
                }, function (err, execution) {
                    if (err) { return done(err); }

                    executionResults = execution;
                    return done();
                });
        });

        it('must reinitialize the variables when same sandbox instance is used again', function (done) {
            ctx.execute(`
                var assert = require('assert');
                assert.strictEqual(pm.variables.get('key-1'), undefined);
                assert.strictEqual(pm.variables.get('key-2'), undefined);
                assert.strictEqual(pm.variables.get('key-3'), undefined);
                assert.strictEqual(pm.variables.get('key-4'), undefined);
                assert.strictEqual(pm.variables.get('key-5'), undefined);
                assert.strictEqual(pm.variables.get('key-6'), undefined);
            `, {
                    timeout: 200,
                    context: {}
                }, function (err, execution) {
                    if (err) { return done(err); }

                    expect(execution.variables.values).to.eql([]);
                    expect(execution.globals.values).to.eql([]);
                    expect(execution.collectionVariables.values).to.eql([]);
                    expect(execution.environment.values).to.eql([]);
                    expect(execution.data).to.be.eql([]);

                    return done();
                });
        });
    });
});
