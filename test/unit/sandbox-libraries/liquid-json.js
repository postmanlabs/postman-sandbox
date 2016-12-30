describe('sandbox library - liquid-json', function () {
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

    it('parses JSON object to string', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.strictEqual(JSON.stringify({x:1}), '{"x":1}');
        `, done);
    });

    it('parses JSON as string', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.deepStrictEqual(JSON.parse('{"x":1}'), {x:1});
        `, done);
    });

    it('correctly removes UTF-8 BOM', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.deepStrictEqual(JSON.parse('ï»¿{"x":1}'), {x:1});
        `, done);
    });

    it('correctly removes UTF-16 BOM', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.deepStrictEqual(JSON.parse(String.fromCharCode(0xFEFF) + '{"x":1}'), {x:1});
        `, done);
    });

    it('correctly removes big endian UTF-16 BOM', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.deepStrictEqual(JSON.parse('þÿ{"x":1}'), {x:1});
        `, done);
    });

    it('correctly removes little endian UTF-16 BOM', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.deepStrictEqual(JSON.parse('ÿþ{"x":1}'), {x:1});
        `, done);
    });

    it('correctly removes UTF-32 BOM', function (done) {
        context.execute(`
            var assert = require('assert');
            assert.deepStrictEqual(JSON.parse('뮿{"x":1}'), {x:1});
        `, done);
    });
});
