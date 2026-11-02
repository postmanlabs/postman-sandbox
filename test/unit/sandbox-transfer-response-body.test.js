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

    it('should keep an SDK Response context intact', function (done) {
        const sdk = require('postman-collection'),
            assertions = [];

        context.on('execution.assertion', (_, list) => { assertions.push(...list); });
        context.execute({
            listen: 'test',
            script: `
                pm.test('header kept', () => pm.expect(pm.response.headers.get('x-test')).to.equal('1'));
                pm.test('body kept', () => pm.expect(pm.response.text()).to.equal('${body}'));
            `
        }, {
            context: {
                response: new sdk.Response({
                    code: 201, header: [{ key: 'x-test', value: '1' }], stream: Buffer.alloc(body.length, 'a')
                })
            },
            transferResponseBody: true
        }, function (err) {
            if (err) { return done(err); }

            expect(assertions.map((a) => { return [a.name, a.passed]; })).to.have.deep.members([
                ['header kept', true],
                ['body kept', true]
            ]);
            done();
        });
    });

    it('should fail the execution at once when the body cannot be moved', function (done) {
        const buf = Buffer.alloc(body.length, 'a'),
            start = Date.now();
        let returned = false;

        context.execute({ listen: 'test', script: script }, {
            context: { response: { code: 200, stream: buf } },
            transferResponseBody: true
        }, function (err) {
            if (err) { return done(err); }

            // buf is detached now, so a second transfer cannot move it
            context.execute({ listen: 'test', script: script }, {
                context: { response: { code: 200, stream: buf } },
                transferResponseBody: true,
                timeout: 60000
            }, function (err) {
                expect(err).to.be.an('error');
                expect(Date.now() - start).to.be.below(5000);
                expect(returned, 'callback runs after execute returns').to.be.true;
                done();
            });
            returned = true;
        });
    });

    it('should say it supports the option only with a uvm that can transfer', function () {
        expect(context).to.have.property('supportsTransferResponseBody', true);

        context.dispatchTransfer = undefined;
        expect(context).to.have.property('supportsTransferResponseBody', false);
        delete context.dispatchTransfer;
    });

    it('should run without a response', function (done) {
        context.execute({
            listen: 'test',
            script: 'require("assert").strictEqual(pm.response.code, undefined);'
        }, { context: {}, transferResponseBody: true }, done);
    });
});
