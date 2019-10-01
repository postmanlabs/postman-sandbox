var sdk = require('postman-collection'),
    Sandbox = require('../../lib');

describe('pm api variables', function () {
    this.timeout(1000 * 60);

    it('should have tracking enabled by default', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute(`
                var assert = require('assert');

                assert.equal(pm.variables.mutations.count(), 0);
                pm.variables.set('foo', 'foo');
                assert.equal(pm.variables.mutations.count(), 1);

                assert.equal(pm.environment.mutations.count(), 0);
                pm.environment.set('foo', 'foo');
                assert.equal(pm.environment.mutations.count(), 1);

                assert.equal(pm.globals.mutations.count(), 0);
                pm.globals.set('foo', 'foo');
                assert.equal(pm.globals.mutations.count(), 1);

                assert.equal(pm.collectionVariables.mutations.count(), 0);
                pm.collectionVariables.set('foo', 'foo');
                assert.equal(pm.collectionVariables.mutations.count(), 1);
            `, done);
        });
    });

    it('should bubble mutations in result', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute(`
                var assert = require('assert');

                pm.variables.set('foo', '_variable');
                pm.environment.set('foo', 'environment');
                pm.globals.set('foo', 'global');
                pm.collectionVariables.set('foo', 'collectionVariables');
            `, function (err, result) {
                if (err) {
                    return done(err);
                }

                expect(result._variables.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result._variables.mutations).count()).to.equal(1);

                expect(result.environment.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result.environment.mutations).count()).to.equal(1);

                expect(result.globals.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result.globals.mutations).count()).to.equal(1);

                expect(result.collectionVariables.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result.collectionVariables.mutations).count()).to.equal(1);

                done();
            });
        });
    });

    it('should should drop initial mutations in context', function (done) {
        var scopeDefinition = {
            values: [
                {key: 'bar', value: 'bar value'}
            ],
            mutations: {
                autoCompact: true,
                compacted: {
                    bar: ['bar', 'bar value']
                }
            }
        };

        Sandbox.createContext({debug: false}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute(`
                var assert = require('assert');

                pm.variables.set('foo', '_variable');
                pm.environment.set('foo', 'environment');
                pm.globals.set('foo', 'global');
                pm.collectionVariables.set('foo', 'collectionVariables');
            `, {
                context: {
                    globals: scopeDefinition,
                    _variables: scopeDefinition,
                    environment: scopeDefinition,
                    collectionVariables: scopeDefinition
                }
            }, function (err, result) {
                if (err) {
                    return done(err);
                }

                expect(result._variables.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result._variables.mutations).count()).to.equal(1);

                expect(result.environment.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result.environment.mutations).count()).to.equal(1);

                expect(result.globals.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result.globals.mutations).count()).to.equal(1);

                expect(result.collectionVariables.mutations).to.be.ok;
                expect(new sdk.MutationTracker(result.collectionVariables.mutations).count()).to.equal(1);

                done();
            });
        });
    });
});
