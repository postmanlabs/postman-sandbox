describe('sandbox library - lodash3', function () {
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

    it('must exist', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual(typeof _, 'function', 'typeof _ must be function');
        `, done);
    });

    it('must be the correct version (avoid lodash4 conflict)', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual(_ && _.VERSION, '3.10.1', '_.VERSION must be 3.10.1');
        `, done);
    });

    it('must have basic functionalities working', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.deepEqual(_.keys({a: true, b: true}), ['a', 'b'], '_.keys shoud return keys as array');
        `, done);
    });
});
