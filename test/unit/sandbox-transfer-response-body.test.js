describe('sandbox transferResponseBody', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../'),
        body = 'a'.repeat(1024),
        script = `
            const assert = require('assert');
            assert.strictEqual(pm.response.text(), '${body}');
            assert.strictEqual(responseBody, '${body}');
        `,
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

    it('should move a Buffer response body to the sandbox', function (done) {
        const buf = Buffer.alloc(body.length, 'a'),
            res = { code: 200, stream: buf };

        context.execute({ listen: 'test', script: script }, {
            context: { response: res },
            transferResponseBody: true
        }, function (err) {
            if (err) { return done(err); }

            expect(buf.buffer.byteLength, 'transferred body is detached').to.equal(0);
            expect(res.stream, 'caller context is not modified').to.equal(buf);
            done();
        });
    });

    it('should copy a Buffer that shares its memory instead of detaching it', function (done) {
        const pool = Buffer.from('xx' + body + 'xx'),
            buf = pool.subarray(2, 2 + body.length);

        context.execute({ listen: 'test', script: script }, {
            context: { response: { code: 200, stream: buf } },
            transferResponseBody: true
        }, function (err) {
            if (err) { return done(err); }

            expect(buf.toString()).to.equal(body);
            done();
        });
    });

    it('should serialize a Buffer response body without the option', function (done) {
        const buf = Buffer.alloc(body.length, 'a');

        context.execute({ listen: 'test', script: script }, {
            context: { response: { code: 200, stream: buf } }
        }, function (err) {
            if (err) { return done(err); }

            expect(buf.toString()).to.equal(body);
            done();
        });
    });

    it('should leave a Base64 response body as is', function (done) {
        context.execute({ listen: 'test', script: script }, {
            context: {
                response: { code: 200, stream: { type: 'Base64', data: Buffer.from(body).toString('base64') } }
            },
            transferResponseBody: true
        }, done);
    });

    it('should run without a response', function (done) {
        context.execute({
            listen: 'test',
            script: 'require("assert").strictEqual(pm.response.code, undefined);'
        }, { context: {}, transferResponseBody: true }, done);
    });
});
