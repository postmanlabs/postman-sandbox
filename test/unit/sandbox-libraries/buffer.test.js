describe('sandbox library - buffer', function () {
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
            var assert = require('assert');
            assert.strictEqual(typeof Buffer, 'function', 'typeof Buffer must be function');
        `, done);
    });

    it('should be able to load from string and export in hex', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from('postman-sandbox');

            assert.strictEqual(buf.toString('hex'), '706f73746d616e2d73616e64626f78', 'hex converstion should match');
        `, done);
    });

    it('should load zero-filled Buffer of length 10', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.alloc(10);

            assert.strictEqual(buf.toString('hex'), '00000000000000000000', 'zero-filled Buffer of length 10');

        `, done);
    });

    it('should load Buffer of length 10, filled with 0x1', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.alloc(10, 1);

            assert.strictEqual(buf.toString('hex'), '01010101010101010101', 'Buffer of length 10, filled with 0x1');
        `, done);
    });

    it('should load uninitialized buffer of length 10', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.allocUnsafe(10);

            assert.strictEqual(buf.toString().length, 10, 'uninitialized buffer of length 10');
        `, done);
    });

    it('should load Buffer containing [0x1, 0x2, 0x3]', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from([1, 2, 3]);

            assert.strictEqual(buf.toString('hex'), '010203', 'Buffer containing [0x1, 0x2, 0x3]');
        `, done);
    });

    it('should load ASCII bytes [0x74, 0x65, 0x73, 0x74]', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from('test');

            assert.strictEqual(buf.toString('hex'), '74657374', 'ASCII bytes [0x74, 0x65, 0x73, 0x74]');
        `, done);
    });

    it('should load UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74]', function (done) {
        context.execute(`
            var assert = require('assert')
                buf = Buffer.from('tést', 'utf8');

            assert.strictEqual(buf.toString('hex'), '74c3a97374', 'UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74]');
        `, done);
    });

    it('should convert ascii to base64', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf = Buffer.from('hello world', 'ascii');

            assert.strictEqual(buf.toString('base64'), 'aGVsbG8gd29ybGQ=', 'conversion of ascii to base64');
        `, done);
    });

    it('should base64 decode extended utf8 characters', function (done) {
        /* eslint-disable @stylistic/js/max-len */
        var fromValue = 'eyJuYW1lIjoi5b6Q5a6BIiwiZW1haWwiOiJ4dW5pbmdoc3VAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6Iueci+aIkeeahOWkp+eZveecvCJ9';

        context.execute(`
           var assert = require('assert'),
               target = JSON.stringify(),
               value = '{"name":"e>\u0010e.\u0001","email":"xuninghsu@example.com","username":"g\u001c\u000bf\b\u0011g\u001a\u0004e$\\'g\u0019=g\u001c<"}'
               buf = Buffer.from('${fromValue}', 'base64');

           assert.strictEqual(buf.toString('ascii'), value, 'conversion from utf8 base64');
        `, done);
        /* eslint-enable @stylistic/js/max-len */
    });

    it('should allow to use deprecated new Buffer syntax', function (done) {
        context.execute(`
            var assert = require('assert'),
                buf1 = new Buffer('buffer'),
                buf2 = new Buffer(buf1),
                buf3 = Buffer(1);

            buf1[0] = 0x61;
            buf3[0] = 0x61;

            assert.strictEqual(buf1.toString(), 'auffer');
            assert.strictEqual(buf2.toString(), 'buffer');
            assert.strictEqual(buf3.toString(), 'a');
    `, done);
    });

    it('should be able to detect Buffer instances using isBuffer', function (done) {
        context.execute(`
            const assert = require('assert'),

                bufUsingFrom = Buffer.from('test'),
                bufUsingNew = new Buffer('test'),
                buf = Buffer(1);

            assert.strictEqual(Buffer.isBuffer(bufUsingFrom), true);
            assert.strictEqual(Buffer.isBuffer(bufUsingNew), true);
            assert.strictEqual(Buffer.isBuffer(buf), true);
        `, done);
    });

    it('should be able to detect Buffer instances using Symbol.hasInstance', function (done) {
        context.execute(`
            const assert = require('assert'),

                bufUsingFrom = Buffer.from('test'),
                bufUsingNew = new Buffer('test');
                buf = Buffer(1);

            assert.strictEqual(bufUsingFrom instanceof Buffer, true);
            assert.strictEqual(bufUsingNew instanceof Buffer, true);
            assert.strictEqual(buf instanceof Buffer, true);
        `, done);
    });

    it('should be able to convert large buffer to string', function (done) {
        // For native buffer, the max string length is ~512MB
        // For browser buffer, the max string length is ~100MB
        const SIZE = (typeof window === 'undefined' ? 511 : 100) * 1024 * 1024;

        context.execute(`
            const assert = require('assert'),
                buf = Buffer.alloc(${SIZE}, 'a');

            assert.strictEqual(buf.toString().length, ${SIZE});
        `, done);
    });

    it('should implement Buffer.compare', function (done) {
        context.execute(`
            const assert = require('assert'),

                buf1 = Buffer.from('abc'),
                buf2 = Buffer.from('abc'),
                buf3 = Buffer.from('abd');

            assert.strictEqual(Buffer.compare(buf1, buf2), 0);
            assert.strictEqual(Buffer.compare(buf1, buf3), -1);
            assert.strictEqual(Buffer.compare(buf3, buf1), 1);
        `, done);
    });

    it('should implement Buffer.byteLength', function (done) {
        context.execute(`
            const assert = require('assert'),
                buf = Buffer.from('abc');

            assert.strictEqual(Buffer.byteLength(buf), 3);
        `, done);
    });

    it('should implement Buffer.concat', function (done) {
        context.execute(`
            const assert = require('assert'),

                buf1 = Buffer.from('abc'),
                buf2 = Buffer.from('def');

            assert.strictEqual(Buffer.concat([buf1, buf2]).toString(), 'abcdef');
        `, done);
    });

    it('should implement Buffer.isEncoding', function (done) {
        context.execute(`
            const assert = require('assert');

            assert.strictEqual(Buffer.isEncoding('utf8'), true);
            assert.strictEqual(Buffer.isEncoding('hex'), true);
            assert.strictEqual(Buffer.isEncoding('ascii'), true);
            assert.strictEqual(Buffer.isEncoding('utf16le'), true);
            assert.strictEqual(Buffer.isEncoding('ucs2'), true);
            assert.strictEqual(Buffer.isEncoding('base64'), true);
            assert.strictEqual(Buffer.isEncoding('binary'), true);

            assert.strictEqual(Buffer.isEncoding('utf-8'), true);
            assert.strictEqual(Buffer.isEncoding('utf/8'), false);
            assert.strictEqual(Buffer.isEncoding(''), false);
        `, done);
    });

    it('should expose Buffer.poolSize', function (done) {
        context.execute(`
            const assert = require('assert');

            assert.strictEqual(typeof Buffer.poolSize, 'number');
        `, done);
    });

    it('should expose SlowBuffer', function (done) {
        context.execute(`
            const assert = require('assert'),
                buffer = require('buffer');

            const buf = new buffer.SlowBuffer(10);
            assert.strictEqual(buf.length, 10);
        `, done);
    });

    it('should expose constants', function (done) {
        context.execute(`
            const assert = require('assert'),
                buffer = require('buffer');

            assert.strictEqual(typeof buffer.kMaxLength, 'number');
            assert.strictEqual(typeof buffer.kStringMaxLength, 'number');
            assert.strictEqual(typeof buffer.constants.MAX_LENGTH, 'number');
            assert.strictEqual(typeof buffer.constants.MAX_STRING_LENGTH, 'number');
            assert.strictEqual(typeof buffer.INSPECT_MAX_BYTES, 'number');

        `, done);
    });

    it('should expose File class', function (done) {
        context.execute(`
            const assert = require('assert'),
                buffer = require('buffer');
            const lastModified = Date.now();
            const file = new buffer.File([], 'filename.txt', { type: 'text/plain', lastModified });
            assert.strictEqual(file.name, 'filename.txt');
            assert.strictEqual(file.lastModified, lastModified);
        `, done);
    });

    it('should expose Blob class', function (done) {
        context.execute(`
            const assert = require('assert'),
                buffer = require('buffer');
            const blob = new buffer.Blob(['hello world'], { type: 'text/plain' });
            assert.strictEqual(blob.size, 11);
        `, done);
    });
});
