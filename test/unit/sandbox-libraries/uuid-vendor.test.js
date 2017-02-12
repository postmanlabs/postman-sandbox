describe('sandbox library - uuid~vendor', function () {
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

    it('must be exposed via require', function (done) {
        context.execute(`
            var assert = require('assert'),
                uuid = require('uuid');

            assert.strictEqual(typeof uuid, 'function', 'typeof require("uuid") must be function');
        `, done);
    });

    it('should generate v4 uuid', function (done) {
        context.execute(`
            var assert = require('assert'),
                uuid = require('uuid');

            assert.strictEqual(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(uuid()),
                true, 'generated string must be uuid v4');
        `, done);
    });

    it('should have a .v4 function for compatibility', function (done) {
        context.execute(`
            var assert = require('assert'),
                uuid = require('uuid');

            assert.strictEqual(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i.test(uuid.v4()),
                true, 'generated string must be uuid v4');
        `, done);
    });
});
