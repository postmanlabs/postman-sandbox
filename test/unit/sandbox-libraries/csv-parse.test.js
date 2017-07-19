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

    it('must exist', function (done) {
        context.execute(`
            var assert = require('assert'),
                csvParse = require('csv-parse/lib/sync');

            assert.strictEqual(typeof csvParse, 'function', 'typeof csv-parse must be function');
        `, done);
    });

    describe('basic functionality', function () {
        it('must work correctly for rudimentary csv data', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync'),

                    data = csvParse('foo');

                assert.deepStrictEqual(data, [['foo']], 'csv-parse must work correctly');
            `, done);
        });

        it('must work correctly for a singelton set', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync'),

                    data = csvParse('foo\\n123');

                assert.deepStrictEqual(data, [['foo'], ['123']], 'csv-parse must work correctly');
            `, done);
        });

        it('must correctly report parsing errors', function (done) {
            context.execute(`
                var assert = require('assert'),
                    csvParse = require('csv-parse/lib/sync');

                assert.throws(function () {
                    csvParse('foo,bar\\n123');
                }, Error, 'csv-parse must correctly report invalid csv input');
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
