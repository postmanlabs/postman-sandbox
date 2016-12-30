describe('sandbox library - moment-timezone', function () {
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
            assert.strictEqual(typeof moment, 'function', 'typeof moment must be function');
        `, done);
    });

    it('must format dates', function (done) {
        context.execute(`
            var assert = require('assert');

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
            var assert = require('assert');

            assert.strictEqual(moment('2017-01-01T10:10:10.000').calendar(), 'Sunday at 10:10 AM');

            assert.strictEqual(moment('2017-01-01T10:10:10.000').subtract(1, 'day').calendar(), 'Tomorrow at 10:10 AM');
            assert.strictEqual(moment('2017-01-01T10:10:10.000').subtract(10, 'days').calendar(), '12/22/2016');

            assert.strictEqual(moment('2017-01-01T10:10:10.000').add(1, 'day').calendar(), 'Monday at 10:10 AM');
            assert.strictEqual(moment('2017-01-01T10:10:10.000').add(10, 'days').calendar(), '01/11/2017');
        `, done);
    });

    describe('locales', function () {
        it('must work with the US locale', function (done) {
            context.execute(`
                var assert = require('assert');

                moment.locale('en');
                assert.strictEqual(moment.locale(), 'en');

                assert.strictEqual(moment.weekdays(3), 'Wednesday');
                assert.strictEqual(moment.weekdaysShort(3), 'Wed');

                assert.strictEqual(moment.months(1), 'February');
                assert.strictEqual(moment.monthsShort(1), 'Feb');
            `, done);
        });

        it('must work with the UK locale', function (done) {
            context.execute(`
                var assert = require('assert');

                moment.locale('en-gb');
                assert(moment.locale(), 'en-gb');

                assert(moment.weekdays(3), 'Wednesday');
                assert(moment.weekdaysShort(3), 'Wed');

                assert(moment.months(1), 'February');
                assert(moment.monthsShort(1), 'Feb');
            `, done);
        });

        it('must work with the Chinese locale', function (done) {
            context.execute(`
                var assert = require('assert');

                moment.locale('zh-cn');
                assert(moment.locale(), 'zh-cn');

                assert(moment.weekdays(3), '星期三');
                assert(moment.weekdaysShort(3), '周三');

                assert(moment.months(1), '二月');
                assert(moment.monthsShort(1), '2月');
            `, done);
        });

        it('must work with the pseudo-locale', function (done) {
            context.execute(`
                var assert = require('assert');

                moment.locale('x-pseudo');
                assert(moment.locale(), 'x-pseudo');

                assert(moment.weekdays(3), 'Wéd~ñésd~áý');
                assert(moment.weekdaysShort(3), '~Wéd');

                assert(moment.months(1), 'F~ébrú~árý');
                assert(moment.monthsShort(1), '~Féb');
            `, done);
        });
    });

    describe('timezone', function () {
        it('must format dates in any timezone', function (done) {
            context.execute(`
                var assert = require('assert'),
                    jun = moment("2014-06-01T12:00:00Z"),
                    dec = moment("2014-12-01T12:00:00Z");

                assert.strictEqual(jun.tz('America/Los_Angeles').format('ha z'), '5am PDT');
                assert.strictEqual(dec.tz('America/Los_Angeles').format('ha z'), '4am PST');

                assert.strictEqual(jun.tz('America/New_York').format('ha z'), '8am EDT');
                assert.strictEqual(dec.tz('America/New_York').format('ha z'), '7am EST');

                assert.strictEqual(jun.tz('Asia/Tokyo').format('ha z'), '9pm JST');
                assert.strictEqual(dec.tz('Asia/Tokyo').format('ha z'), '9pm JST');

                assert.strictEqual(jun.tz('Australia/Sydney').format('ha z'), '10pm AEST');
                assert.strictEqual(dec.tz('Australia/Sydney').format('ha z'), '11pm AEDT');
            `, done);
        });

        it('must convert date between timezones', function (done) {
            context.execute(`
                var assert = require('assert'),

                    newYork = moment.tz("2014-06-01 12:00", "America/New_York"),
                    losAngeles = newYork.clone().tz("America/Los_Angeles"),
                    london = newYork.clone().tz("Europe/London");

                assert.strictEqual(newYork.format(), '2014-06-01T12:00:00-04:00');
                assert.strictEqual(losAngeles.format(), '2014-06-01T09:00:00-07:00');
                assert.strictEqual(london.format(), '2014-06-01T17:00:00+01:00');
            `, done);
        });
    });
});
