describe('sandbox library - sugarjs', function () {
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

            assert.strictEqual(typeof new Date().format, 'function', 'Extended Date prototype must exist');
            assert.strictEqual(typeof 'asdasd'.has, 'function', 'Extended String prototype must exist');
            assert.strictEqual(typeof Object.each, 'function', 'Extended Object prototype must exist');
            assert.strictEqual(typeof Date.create, 'function', 'Extended Date prototype must exist');
        `, done);
    });

    it('must expose sugarjs functionality', function (done) {
        context.execute(`
            var assert = require('assert'),
                d = new Date(1470659144696); // Monday, Aug 08, 2016

            assert.strictEqual(d.format('{Weekday}'), 'Monday', 'Date.prototype.format must format dates correctly');
            assert('asdasd'.has('as'), 'String.prototype.has must detect sub strings correctly');
            assert(!!(1).daysAfter(new Date()).format('{yyyy}{MM}{dd}'), 'Date.prototype.format must be a function');
        `, done);
    });

    describe('Extended prototypes', function () {
        it('Array must work correctly', function (done) {
            context.execute(`
                var assert = require('assert');
    
                assert(['a', 'b', 'c'].none('d'), 'Array.prototype.none must work correctly');
                assert([ [1,2], [2,3] ].any([2,3]), 'Array.prototype.any must work correctly');
                assert.strictEqual([ 1, 2, 3, 4, 5 ].average(), 3, 'Array.prototype.average must work correctly');
            `, done);
        });

        it('Date must work correctly', function (done) {
            context.execute(`
                var assert = require('assert');
    
                assert.equal(Date.now(), (new Date()).getTime(), 'Date.prototype.getTime must work correctly');
                assert(Date.create('next week').isFuture(), 'Date.prototype.isFuture must work correctly');
                assert(Date.create('2000').isLeapYear(), 'Date.prototype.isLeapYear must work correctly');
                assert(Date.create('last week').isPast(), 'Date.prototype.isPast must work correctly');
                assert(new Date().isValid(), 'Date.prototype.isValid must work correctly');
                assert(!(new Date('random string').isValid()), 'Negated Date.prototype.isValid must work correctly');
            `, done);
        });

        it('Function must work correctly', function (done) {
            context.execute(`
                var assert = require('assert');
    
                var fCount = 0,
                    fn = (function() { fCount++; }).once();
    
                fn(); fn(); fn();
                assert.strictEqual(fCount, 1, 'Function.prototype.once must work correctly');
            `, done);
        });

        it('Number must work correctly', function (done) {
            context.execute(`
                var assert = require('assert');
    
                assert((56).isEven(), 'Number.prototype.isEven must work correctly');
                assert.strictEqual((56).hex(), '38', 'Number.prototype.hex must work correctly');
                assert.strictEqual((56).ordinalize(), '56th', 'Number.prototype.ordinalize must work correctly');
                assert.strictEqual((56789.10).format(), '56,789.1', 'Number.prototype.format must work correctly');
            `, done);
        });

        it('String must work correctly', function (done) {
            context.execute(`
                var assert = require('assert');
    
                assert('jumpy'.endsWith('py'), 'String.prototype.endsWith must work correctly');
                assert.strictEqual('abc'.shift(5), 'fgh', 'String.prototype.shift must work correctly');
                assert.strictEqual('a'.repeat(5), 'aaaaa', 'String.prototype.repeat must work correctly');
                assert(!('jumpy'.endsWith('MPY')), 'Negated String.prototype.endsWith must work correctly');
                assert.strictEqual('a-beta'.camelize(), 'ABeta', 'String.prototype.camelize must work correctly');
                assert.strictEqual('a-b_cD'.spacify(), 'a b c d', 'String.prototype.spacify must work correctly');
            `, done);
        });
    });
});
