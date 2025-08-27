describe('tests for event to receive variables in current sandbox execution scope', function () {
    this.timeout(1000 * 60);
    const Sandbox = require('../../lib');

    let context;

    beforeEach(function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    it('should return current variables values in scope on receiving execution.get_variables_from_this_execution event',
        function (done) {
            const executionId = '1',
                variableValuesRequestUniqueId = '1',
                sampleContextData = { globals: [{ key: 'var1', value: 'one' }] };

            context.on('execution.response_to_variables_request.' + variableValuesRequestUniqueId, function (vars) {
                expect(vars).to.be.ok;
                expect(vars.environment).to.be.ok;
                expect(vars.globals).to.be.ok;
                expect(vars._variables).to.be.ok;
                expect(vars.collectionVariables).to.be.ok;

                expect(vars.environment[0].key).to.eql('sample_env_var');
                expect(vars.environment[0].value).to.eql('sample_env_val');

                expect(vars._variables[0].key).to.eql('sample_local_var');
                expect(vars._variables[0].value).to.eql('sample_local_val');

                // Passed from outside
                expect(vars.globals[0].key).to.eql('var1');
                expect(vars.globals[0].value).to.eql('one');
                // Set from inside script
                expect(vars.globals[1].key).to.eql('sample_global_var');
                expect(vars.globals[1].value).to.eql('sample_global_val');

                expect(vars.collectionVariables[0].key).to.eql('sample_collection_var');
                expect(vars.collectionVariables[0].value).to.eql('sample_collection_val');

                done();
            });

            context.execute(`
                pm.environment.set('sample_env_var', 'sample_env_val');
                pm.globals.set('sample_global_var', 'sample_global_val');
                pm.variables.set('sample_local_var', 'sample_local_val');
                pm.collectionVariables.set('sample_collection_var', 'sample_collection_val');
            `, { id: executionId, context: sampleContextData }, function (err) {
                if (err) { return done(err); }
            });

            context.dispatch('execution.get_variables_from_this_execution.' + executionId,
                variableValuesRequestUniqueId);
        });
});
