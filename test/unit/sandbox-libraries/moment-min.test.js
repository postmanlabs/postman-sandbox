describe('sandbox library - moment.min', function () {
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
            var assert = require('assert'),
                moment = require('moment');

            assert.strictEqual(typeof moment, 'function', 'typeof moment must be function');
        `, done);
    });

    it('must format dates', function (done) {
        context.execute(`
            var assert = require('assert'),
                moment = require('moment');

            assert.strictEqual(moment('2017-01-01T10:10:10.000').format('MMMM Do YYYY, h:mm:ss a'),
                'January 1st 2017, 10:10:10 am');
            assert.strictEqual(moment('2017-01-01T10:10:10.000').format('dddd'), 'Sunday');
            assert.strictEqual(moment('2017-01-01T10:10:10.000').format("MMM Do YY"), 'Jan 1st 17');
            assert.strictEqual(moment('2017-01-01T10:10:10.000').format('YYYY [escaped] YYYY'), '2017 escaped 2017');
        `, done);
    });

    it('must format relative time', function (done) {
        context.execute(`
            var assert = require('assert'),
                moment = require('moment'),
                start = moment([2007, 0, 28]),
                end = moment([2007, 0, 29]);

            assert.strictEqual(start.to(start, true), 'a few seconds');
            assert.strictEqual(start.to(start), 'a few seconds ago');            

            assert.strictEqual(start.to(end, true), 'a day');
            assert.strictEqual(start.to(end), 'in a day');

            assert.strictEqual(end.to(start, true), 'a day');
            assert.strictEqual(end.to(start), 'a day ago');
        `, done);
    });

    it('must format calendar time', function (done) {
        context.execute(`
            var assert = require('assert'),
                moment = require('moment'),
                reference = '2017-01-01T10:10:10.000';

            assert.strictEqual(moment(reference).calendar(reference), 'Today at 10:10 AM');

            assert.strictEqual(moment(reference).subtract(1, 'day').calendar(reference), 'Yesterday at 10:10 AM');
            assert.strictEqual(moment(reference).subtract(10, 'days').calendar(reference), '12/22/2016');

            assert.strictEqual(moment(reference).add(1, 'day').calendar(reference), 'Tomorrow at 10:10 AM');
            assert.strictEqual(moment(reference).add(10, 'days').calendar(reference), '01/11/2017');
        `, done);
    });

    describe('locales', function () {
        it('must work with the US locale', function (done) {
            context.execute(`
                var assert = require('assert'),
                    moment = require('moment');

                moment.locale('en');
                assert.strictEqual(moment.locale(), 'en');

                assert.strictEqual(moment.weekdays(3), 'Wednesday');
                assert.strictEqual(moment.weekdaysShort(3), 'Wed');

                assert.strictEqual(moment.months(1), 'February');
                assert.strictEqual(moment.monthsShort(1), 'Feb');
            `, done);
        });

        it('must not work with the UK locale', function (done) {
            context.execute(`
                var assert = require('assert'),
                    moment = require('moment');

                moment.locale('en-gb');
                assert.strictEqual(moment.locale(), 'en');

                assert.strictEqual(moment.weekdays(3), 'Wednesday');
                assert.strictEqual(moment.weekdaysShort(3), 'Wed');

                assert.strictEqual(moment.months(1), 'February');
                assert.strictEqual(moment.monthsShort(1), 'Feb');
            `, done);
        });

        it('must not work with the Chinese locale', function (done) {
            context.execute(`
                var assert = require('assert'),
                    moment = require('moment');

                moment.locale('zh-cn');
                assert.strictEqual(moment.locale(), 'en');

                assert.strictEqual(moment.weekdays(3), 'Wednesday');
                assert.strictEqual(moment.weekdaysShort(3), 'Wed');

                assert.strictEqual(moment.months(1), 'February');
                assert.strictEqual(moment.monthsShort(1), 'Feb');
            `, done);
        });

        it('must not work with the pseudo-locale', function (done) {
            context.execute(`
                var assert = require('assert'),
                    moment = require('moment');

                moment.locale('x-pseudo');
                assert.strictEqual(moment.locale(), 'en');

                assert.strictEqual(moment.weekdays(3), 'Wednesday');
                assert.strictEqual(moment.weekdaysShort(3), 'Wed');

                assert.strictEqual(moment.months(1), 'February');
                assert.strictEqual(moment.monthsShort(1), 'Feb');
            `, done);
        });
    });
});
