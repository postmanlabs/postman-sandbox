describe('sandbox vendor - btoa', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        context;

    beforeEach(function (done) {
        Sandbox.createContext({ debug: true }, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('should exist in global', function (done) {
        context.execute(`
            const assert = require('assert');
            assert.strictEqual(typeof btoa, 'function', 'typeof btoa must be function');
        `, done);
    });

    it('should be exposed via require', function (done) {
        context.execute(`
            const assert = require('assert');
            const btoa = require('btoa');
            assert.strictEqual(typeof btoa, 'function', 'typeof btoa must be function');
        `, done);
    });

    it('should have same implementation exposed via global, require and buffer', function (done) {
        context.execute(`
            const assert = require('assert');
            const requiredBtoa = require('btoa');
            const bufferBtoa = require('buffer').btoa;
            assert.strictEqual(btoa === requiredBtoa, true);
            assert.strictEqual(btoa === bufferBtoa, true);
        `, done);
    });

    it('should encode a string to base64', function (done) {
        context.execute(`
            const assert = require('assert');
            const decoded = btoa('postman-sandbox');
            assert.strictEqual(decoded, 'cG9zdG1hbi1zYW5kYm94');
        `, done);
    });
});
