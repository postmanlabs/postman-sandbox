describe('sandbox library - buffer', function () {
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

    it('must exist in global', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual(typeof Buffer, 'function', 'typeof Buffer must be function');
        `, done);
    });

    it('must be able to load from string and export in hex', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from('postman-sandbox');

            assert.strictEqual(buf.toString('hex'), '706f73746d616e2d73616e64626f78', 'hex converstion should match');
        `, done);
    });

    it('must load zero-filled Buffer of length 10', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.alloc(10);

            assert.strictEqual(buf.toString('hex'), '00000000000000000000', 'zero-filled Buffer of length 10');

        `, done);
    });

    it('must load Buffer of length 10, filled with 0x1', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.alloc(10, 1);

            assert.strictEqual(buf.toString('hex'), '01010101010101010101', 'Buffer of length 10, filled with 0x1');
        `, done);
    });

    it('must load uninitialized buffer of length 10', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.allocUnsafe(10);

            assert.strictEqual(buf.toString().length, 10, 'uninitialized buffer of length 10');
        `, done);
    });

    it('must load Buffer containing [0x1, 0x2, 0x3]', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from([1, 2, 3]);

            assert.strictEqual(buf.toString('hex'), '010203', 'Buffer containing [0x1, 0x2, 0x3]');
        `, done);
    });

    it('must load ASCII bytes [0x74, 0x65, 0x73, 0x74]', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from('test');

            assert.strictEqual(buf.toString('hex'), '74657374', 'ASCII bytes [0x74, 0x65, 0x73, 0x74]');
        `, done);
    });

    it('must load UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74]', function (done) {
        context.execute(`
            var assert = require('assert')
                buf = Buffer.from('tést', 'utf8');

            assert.strictEqual(buf.toString('hex'), '74c3a97374', 'UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74]');
        `, done);
    });

    it('must convert ascii to base64', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from('hello world', 'ascii');

            assert.strictEqual(buf.toString('base64'), 'aGVsbG8gd29ybGQ=', 'converstion of ascii to base64');
        `, done);
    });

    it('must base64 decode extended utf8 characters', function (done) {
        /* eslint-disable max-len */
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from('eyJuYW1lIjoi5b6Q5a6BIiwiZW1haWwiOiJ4dW5pbmdoc3VAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6Iueci+aIkeeahOWkp+eZveecvCJ9', 'base64');

            assert.strictEqual(buf.toString('ascii'), '{"name":"e>\\u0010e.\\u0001","email":"xuninghsu@example.com","username":"g\\u001c\\u000bf\\b\\u0011g\\u001a\\u0004e$\\'g\\u0019=g\\u001c<"}', 'converstion from utf8 base64');
        `, done);
        /* eslint-enable max-len */
    });

    it('must allow to use deprecated new Buffer syntax', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf1 = new Buffer('buffer'),
                buf2 = new Buffer(buf1);

            buf1[0] = 0x61;

            assert.strictEqual(buf1.toString(), 'auffer');
            assert.strictEqual(buf2.toString(), 'buffer');
    `, done);
    });
});
