describe('sandbox library - TV4', function () {
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

            assert.strictEqual(typeof tv4, 'object', 'typeof tv4 must be object');
            assert.strictEqual(typeof tv4.validate, 'function', 'typeof tv4.validate must be function');
        `, done);
    });

    it('must have basic functionality working', function (done) {
        context.execute(`
            var assert = require('assert'),
                schema = {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "type": "object",
                    "properties": {
                        "alpha": {
                            "type": "boolean"
                        }
                    }
                };

            assert(tv4.validate({alpha: true}, schema), 'TV4 schema validation must identify valid objects');
        `, done);
    });
});
