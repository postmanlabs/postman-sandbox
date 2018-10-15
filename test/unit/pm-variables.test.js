var sdk = require('postman-collection'),
    Sandbox = require('../../lib');

describe('pm.variables', function () {
    var ctx,
        executionResults;

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
            var globalVarList = new sdk.VariableList(null, {key: 'key-1', value: 'value-1'}),
                collectionVarList = new sdk.VariableList(null, {key: 'key-2', value: 'value-2'}),
                envVarList = new sdk.VariableList(null, {key: 'key-3', value: 'value-3'}),
                contextData = {'key-4': 'value-4'},
                localVarList = new sdk.VariableList(null, {key: 'key-5', value: 'value-5'});

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
                    _variables: new sdk.VariableScope(localVarList)
                }
            }, function (err, execution) {
                if (err) { return done(err); }

                executionResults = execution;
                return done();
            });
        });

        it('should return the modified variables in the result', function () {
            expect(executionResults).to.deep.nested.include({'_variables.values': [
                {type: 'any', value: 'modified', key: 'key-5'},
                {type: 'any', value: 'modified', key: 'key-1'},
                {type: 'any', value: 'modified', key: 'key-2'},
                {type: 'any', value: 'modified', key: 'key-3'},
                {type: 'any', value: 'modified', key: 'key-4'},
                {type: 'any', value: 'new', key: 'key-6'}
            ]});
        });

        it('should not modify the globals, envrironment, collection and data variables', function () {
            expect(executionResults).to.deep.nested.include({
                'globals.values': [
                    {type: 'any', value: 'value-1', key: 'key-1'}
                ],
                'collectionVariables.values': [
                    {type: 'any', value: 'value-2', key: 'key-2'}
                ],
                'environment.values': [
                    {type: 'any', value: 'value-3', key: 'key-3'}
                ],
                data: {'key-4': 'value-4'}
            });
        });

        it('should be able to work with empty variables passed in context', function (done) {
            ctx.execute(`
                pm.variables.set("key-1", "modified");
            `, {
                timeout: 200,
                context: {
                    variables: undefined
                }
            }, function (err, execution) {
                if (err) { return done(err); }

                expect(execution).to.deep.nested.include({'_variables.values': [
                    {type: 'any', value: 'modified', key: 'key-1'}
                ]});
                return done();
            });
        });

        it('should be able to work with json variables', function (done) {
            ctx.execute(`
                pm.variables.set('myObject', { version: 'v1' }, 'json');
            `, {
                timeout: 200,
                context: {
                    variables: undefined
                }
            }, function (err, execution) {
                if (err) { return done(err); }

                expect(execution).to.deep.nested.include({'_variables.values': [
                    {type: 'json', value: '{"version":"v1"}', key: 'myObject'}
                ]});
                return done();
            });
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

                assert.strictEqual(pm.variables.get('key-1'), 'value-1');
                assert.strictEqual(pm.variables.get('key-2'), 'value-2');
                assert.strictEqual(pm.variables.get('key-3'), 'value-3');
                assert.strictEqual(pm.variables.get('key-4'), 'value-4');
                assert.strictEqual(pm.variables.get('key-5'), 'value-5');
                assert.deepEqual(pm.variables.toObject(), {
                    'key-1': 'value-1',
                    'key-2': 'value-2',
                    'key-3': 'value-3',
                    'key-4': 'value-4',
                    'key-5': 'value-5'
                });
            `, {
                timeout: 200,
                context: {
                    globals: new sdk.VariableScope(globalVarList),
                    collectionVariables: new sdk.VariableScope(collectionVarList),
                    environment: new sdk.VariableScope(envVarList),
                    data: contextData,
                    _variables: new sdk.VariableScope(localVarList)
                }
            }, function (err, execution) {
                if (err) { return done(err); }

                executionResults = execution;
                return done();
            });
        });

        it('should return appropriate variables', function (done) {
            var globalVarList = new sdk.VariableList(null, {key: 'key-1', value: 'value-1'}),
                collectionVarList = new sdk.VariableList(null, {key: 'key-2', value: 'value-2'}),
                envVarList = new sdk.VariableList(null, {key: 'key-3', value: 'value-3'}),
                contextData = {'key-4': 'value-4'},
                localVarList = new sdk.VariableList(null, {key: 'key-5', value: 'value-5'});

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
                    _variables: new sdk.VariableScope(localVarList)
                }
            }, function (err, execution) {
                if (err) { return done(err); }

                executionResults = execution;
                return done();
            });
        });

        it('should reinitialize the variables when same sandbox instance is used again', function (done) {
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

                expect(execution).to.deep.nested.include({
                    'globals.values': [],
                    '_variables.values': [],
                    'collectionVariables.values': [],
                    'environment.values': [],
                    data: {}
                });

                return done();
            });
        });
    });
});
