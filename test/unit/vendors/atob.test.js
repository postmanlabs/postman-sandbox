describe('sandbox vendor - atob', function () {
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
            assert.strictEqual(typeof atob, 'function', 'typeof atob must be function');
        `, done);
    });

    it('should be exposed via require', function (done) {
        context.execute(`
            const assert = require('assert');
            const atob = require('atob');
            assert.strictEqual(typeof atob, 'function', 'typeof atob must be function');
        `, done);
    });

    it('should have same implementation exposed via global, require and buffer', function (done) {
        context.execute(`
            const assert = require('assert');
            const requiredAtob = require('atob');
            const bufferAtob = require('buffer').atob;
            assert.strictEqual(atob === requiredAtob, true);
            assert.strictEqual(atob === bufferAtob, true);
        `, done);
    });

    it('should decode base64 encoded string', function (done) {
        context.execute(`
            const assert = require('assert');
            const decoded = atob('cG9zdG1hbi1zYW5kYm94');
            assert.strictEqual(decoded, 'postman-sandbox');
        `, done);
    });
});
