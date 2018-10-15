describe('sandbox library - csv-parse/lib/sync', function () {
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
            var assert = require('assert'),
                csvParse = require('csv-parse/lib/sync');

            assert.strictEqual(typeof csvParse, 'function', 'typeof csv-parse must be function');
        `, done);
    });

    describe('basic functionality', function () {
        it('should work correctly for rudimentary csv data', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync'),

                    data = csvParse('foo');

                assert.deepStrictEqual(data, [['foo']], 'csv-parse must work correctly');
            `, done);
        });

        it('should work correctly for a singelton set', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync'),

                    data = csvParse('foo\\n123');

                assert.deepStrictEqual(data, [['foo'], ['123']], 'csv-parse must work correctly');
            `, done);
        });

        it('should handle malformed input correctly', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync');

                assert.deepStrictEqual(csvParse('foo,bar\\n123'), [['foo', 'bar']]);
            `, done);
        });
    });

    describe('options', function () {
        it('should correctly treat the first row as a header', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync'),

                    data = csvParse('foo\\n123', { columns: true });

                assert.deepStrictEqual(data, [{foo: '123'}], 'Column headers must be treated correctly');
            `, done);
        });

        it('should correctly handle custom escape sequences', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync'),

                    data = csvParse('foo,bar\\n"alpha","b/"et/"a"', { escape: '/' });

                assert.deepStrictEqual(data, [['foo','bar'],['alpha','b"et"a']],
                    'Custom escape sequences must be respected');
            `, done);
        });

        it('should correctly parse stringified numbers', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync'),

                    data = csvParse('foo\\n123', { auto_parse: true });

                assert.deepStrictEqual(data, [['foo'], [123]], 'Stringified numbers must be parsed correctly');
            `, done);
        });
    });
});
