describe('sandbox library - AJV', function () {
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

    it('should exist', function (done) {
        context.execute(`
            var Ajv = require('ajv'),
                assert = require('assert');

            assert.strictEqual(typeof Ajv, 'function', 'typeof Ajv must be function');
            assert.strictEqual(typeof new Ajv(), 'object', 'typeof new Ajv() must be object');
        `, done);
    });

    describe('methods', function () {
        it('validate', function (done) {
            context.execute(`
                var Ajv = require('ajv'),
                    assert = require('assert'),

                    ajv = new Ajv(),

                    schema = {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "type": "object",
                        "properties": {
                            "alpha": {
                                "type": "boolean"
                            }
                        }
                    };

                assert(ajv.validate(schema, {alpha: true}), 'AJV schema validation must identify valid objects');
            `, done);
        });

        it('compile', function (done) {
            context.execute(`
                var Ajv = require('ajv'),
                    assert = require('assert'),

                    ajv = new Ajv(),

                    schema = {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "type": "object",
                        "properties": {
                            "alpha": {
                                "type": "boolean"
                            }
                        }
                    },

                    validate = ajv.compile(schema);

                assert(validate({alpha: true}), 'AJV schema validation must identify valid objects');
            `, done);
        });

        (typeof window === 'undefined' ? it : it.skip)('compileAsync', function (done) {
            context.execute(`
                var Ajv = require('ajv'),

                    SCHEMAS = {
                        'https://schema.getpostman.com/collection.json': {
                            $id: 'https://schema.getpostman.com/collection.json',
                            required: ['request'],
                            properties: {
                                name: {type: 'string'},
                                request: {$ref: 'request.json'}
                            }
                        },
                        'https://schema.getpostman.com/request.json': {
                            $id: 'https://schema.getpostman.com/request.json',
                            required: ['url'],
                            properties: {
                                method: {type: 'string'},
                                url: {$ref: 'url.json'}
                            }
                        },
                        'https://schema.getpostman.com/url.json': {
                            $id: 'https://schema.getpostman.com/url.json',
                            properties: {
                                protocol: {type: 'string'},
                                host: {type: 'string'}
                            }
                        }
                    },

                    ajv = new Ajv({
                        loadSchema: function (uri) {
                            return new Promise(function (resolve, reject) {
                                setTimeout(function () {
                                    SCHEMAS[uri] ? resolve(SCHEMAS[uri]) : reject(new Error('404'));
                                }, 10);
                            });
                        }
                    }),

                    valid;

                ajv.compileAsync(SCHEMAS['https://schema.getpostman.com/collection.json'])
                    .then(function (validate) {
                        valid = validate({
                            name: 'test',
                            request: {
                                method: 'GET',
                                url: 'https://getpostman.com'
                            }
                        });
                    });

                // this hack is required since we can't assert on async functions
                setTimeout(function () {
                    pm.globals.set('valid', valid);
                }, 100);
            `, {
                timeout: 200
            }, function (err, res) {
                if (err) { return done(err); }

                expect(err).to.be.null;
                expect(res).to.nested.include({
                    'return.async': true
                });

                expect(res).to.have.property('globals').that.has.property('values').that.is.an('array');
                expect(res.globals.values[0].value).to.be.true;
                done();
            });
        });
    });
});
