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

    describe('random generation', function () {
        it('must work correctly for strings', function (done) {
            context.execute(`
                var assert = require('assert');

                assert.strictEqual(CryptoJS.lib.WordArray.create(8).words, 8, 'Random byte order must match provision');
            `, done);
        });

        it('must work correctly for bytes', function (done) {
            context.execute(`
                var assert = require('assert'),
                    rand = CryptoJS.lib.WordArray.random,
                    randomSample = rand(8);

                assert.deepEqual(rand(), {words: [], sigBytes: 0}, 'Random bytes must be empty without a range');
                assert(Array.isArray(randomSample.words), 'Random byte order must have an array of random words');
                assert(randomSample.words.length, 'Random byte order array must be non empty for valid range');
                assert.strictEqual(rand(8).sigBytes, 8, 'Random byte order must match provision');
                assert.notDeepEqual(rand(8), rand(8), 'Random bytes must be non-identical');
            `, done);
        });

        it('must correctly concatenate sequences', function (done) {
            context.execute(`
                var assert = require('assert'),
                    wordArray = CryptoJS.lib.WordArray.create([0x12345678], 4);

                assert.strictEqual(wordArray.concat(CryptoJS.lib.WordArray.create([0x12345678], 3)).toString(),
                    '12345678123456', 'Concat must merge into a sequence');
                assert.strictEqual(wordArray.toString(), '12345678123456', 'Concat must mutate the WordArray');
            `, done);
        });

        it('must correctly concatenate long sequences', function (done) {
            context.execute(`
                var assert = require('assert'),
                    alpha = CryptoJS.lib.WordArray.create(),
                    beta = CryptoJS.lib.WordArray.create(),
                    gamma = CryptoJS.lib.WordArray.create();

                for (var i = 0; i < 500000; i++) { beta.words[i] = gamma.words[i] = i; }
                beta.sigBytes = gamma.sigBytes = 500000;

                assert.strictEqual(beta.toString() + gamma.toString(), alpha.concat(beta.concat(gamma)).toString(),
                    'Sequence concatenation must be consistent');
            `, done);
        });

        it('must correctly clamp random bytes', function (done) {
            context.execute(`
                var assert = require('assert'),
                    wordArray = CryptoJS.lib.WordArray.create([0x12345678, 0x12345678], 3);

                wordArray.clamp();
                assert.strictEqual([0x12345600].toString(), wordArray.words.toString(), 'Clamped bytes must match');
            `, done);
        });

        it('must correctly clone random bytes', function (done) {
            context.execute(`
                var assert = require('assert'),
                    wordArray = CryptoJS.lib.WordArray.create([0x12345678]),
                    clone = wordArray.clone();

                clone.words[0] = 0;
                assert.notEqual(wordArray.toString(), clone.toString(), 'Byte cloning must be deep');
            `, done);
        });
    });
});
