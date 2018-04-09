describe('sandbox library - postman legacy', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        context;

    beforeEach(function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    describe('postman environment related functions', function () {
        it('should be able to clear all environments', function (done) {
            context.execute(`
                var assert = require('assert');
                assert.strictEqual(environment.a, 'b', 'environment must be initially set');
                postman.clearEnvironmentVariables();
                assert.equal(Object.keys(environment).length, 0, 'environment must be cleared');
            `, {
                context: {
                    environment: [{
                        key: 'a',
                        value: 'b'
                    }]
                }
            }, done);
        });
    });
});
