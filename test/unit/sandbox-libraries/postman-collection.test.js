describe('sandbox library - postman-collection', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        context;

    beforeEach(function (done) {
        Sandbox.createContext(function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('should be exposed via require', function (done) {
        context.execute(`
            var assert = require('assert'),
                sdk = require('postman-collection');

            assert.strictEqual(!!sdk, true, '!!sdk should be truthy');
        `, done);
    });

    it('should construct a collection', function (done) {
        context.execute(`
            var assert = require('assert'),
                sdk = require('postman-collection'),

                collection;

            collection = new sdk.Collection({
                item: {
                    id: 'get-one',
                    request: 'http://postman-echo.com/get?test=123'
                }
            });


            assert.strictEqual(sdk.Collection.isCollection(collection),
                true, 'Collection.isCollection(collection) should be true');

            assert.strictEqual(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
                .test(collection.id), true, 'collection must have a valid id');

            assert.strictEqual(sdk.PropertyList.isPropertyList(collection.items), true, 'has an itemgroup');
            assert.strictEqual(collection.items.has('get-one'), true, 'items.has lookup get-one item');

            assert.strictEqual(collection.items.one('get-one').request.url.toString(),
                'http://postman-echo.com/get?test=123');
        `, done);
    });

    it('should construct a response', function (done) {
        context.execute(`
            var assert = require('assert'),
                sdk = require('postman-collection'),

                response;

            response = new sdk.Response({
                stream: Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72])
            });


            assert.strictEqual(response.text(), 'buffer', 'converts stream in response to text');
        `, done);
    });

    it('should construct a variable scope', function (done) {
        context.execute(`
            var assert = require('assert'),
                sdk = require('postman-collection'),

                variables;

            variables = new sdk.VariableScope({
                values: [{
                    key: 'var1',
                    value: 'val1'
                }, {
                    key: 'var2',
                    value: 'val2'
                }]
            });


            assert.strictEqual(variables.syncVariablesTo().var1, 'val1');
            assert.strictEqual(variables.syncVariablesTo().var2, 'val2');
        `, done);
    });

    it('should resolve dynamic variables using pm.variables.replaceIn', function (done) {
        context.execute(`
            var assert = require('assert'),
                replaceIn = pm.variables.replaceIn,
                variables = [
                    '$guid', '$timestamp', '$isoTimestamp', '$randomInt', '$randomPhoneNumber', '$randomWords',
                    '$randomLocale', '$randomDirectoryPath', '$randomCity', '$randomCountry', '$randomBs',
                    '$randomUrl', '$randomPassword', '$randomFullName', '$randomMonth', '$randomLoremParagraphs'
                ],
                guidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                ipRE = /^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}(?= - -)/;

            for (var variable of variables) {
                var resolved = replaceIn(\`{{\${variable}}}\`);
                assert.notStrictEqual(resolved, \`{{\${variable}}}\`);
            }

            assert.ok(guidRE.test(replaceIn("{{$guid}}")));
            assert.ok(replaceIn("{{$randomWords}}").split(' ').length > 1);
            assert.ok(replaceIn('{{$randomPhoneNumber}}').length === 12);
            assert.ok(replaceIn('{{$randomBankAccount}}').length === 8);
            assert.strictEqual(replaceIn('{{$randomImageUrl}}'), 'http://placeimg.com/640/480');
        `, done);
    });
});
