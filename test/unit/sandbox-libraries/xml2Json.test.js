describe('sandbox library - xml2Json', function () {
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

    it('should exist', function (done) {
        context.execute(`
            var assert = require('assert');

            assert.strictEqual(typeof xml2Json, 'function', 'typeof xml2Json must be function');
        `, done);
    });

    it('should have basic functionality working', function (done) {
        context.execute(`
            var assert = require('assert'),
                xml = '<food><key>Homestyle Breakfast</key><value>950</value></food>',
                object = xml2Json(xml).food;

            assert.strictEqual(object.key, 'Homestyle Breakfast', 'xml2Json conversion must be valid');
            assert.strictEqual(object.value, '950', 'xml2Json conversion must be valid');
        `, done);
    });
});
