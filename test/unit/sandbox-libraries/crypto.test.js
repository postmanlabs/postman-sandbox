describe('sandbox library - CryptoJS', function () {
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

            assert.strictEqual(typeof CryptoJS, 'object', 'typeof CryptoJS must be object');
            assert.strictEqual(typeof CryptoJS.AES.encrypt, 'function', 'typeof CryptoJS.AES.encrypt must be function');
            assert.strictEqual(typeof CryptoJS.AES.decrypt, 'function', 'typeof CryptoJS.AES.decrypt must be function');
        `, done);
    });

    it('must have basic functionality working', function (done) {
        context.execute(`
            var assert = require('assert'),
                ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123'),
 
                bytes  = CryptoJS.AES.decrypt(ciphertext.toString(), 'secret key 123'),
                plaintext = bytes.toString(CryptoJS.enc.Utf8);

            assert.strictEqual(plaintext, 'my message', 'Encryption-decryption must be valid');
        `, done);
    });
});
