describe('sandbox library - pm api', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        context;

    beforeEach(function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('pm object should be in globals', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual(typeof pm, 'object');
        `, done);
    });
});
