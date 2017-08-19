var assert = require('assert'),
    sdk = require('postman-collection');

describe('Collection SDK in Node VM', function () {
    it('should exist', function () {
        assert.strictEqual(Boolean(sdk), true, '!!sdk should be truthy');
    });

    it('should work correctly for collections', function () {
        var collection = new sdk.Collection({
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
    });

    it('should work correctly for responses', function () {
        var response = new sdk.Response({
            stream: new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72])
        });

        assert.strictEqual(response.text(), 'buffer', 'converts stream in response to text');
    });

    it('should work correctly for variable scopes', function () {
        var variables = new sdk.VariableScope({
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
    });
});
