describe.only('sandbox library - moment-timezone', function () {
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

            assert.strictEqual(moment(1483245610000).format('MMMM Do YYYY, h:mm:ss a'),
                'January 1st 2017, 10:10:10 am');
            assert.strictEqual(moment(1483245610000).format('dddd'), 'Sunday');
            assert.strictEqual(moment(1483245610000).format("MMM Do YY"), 'Jan 1st 17');
            assert.strictEqual(moment(1483245610000).format('YYYY [escaped] YYYY'), '2017 escaped 2017');
        `, done);
    });

    it.skip('must format relative time', function () {});
    it.skip('must format calendar time', function () {});

    describe.skip('locales', function () {});

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
