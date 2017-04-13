describe('sandbox "sandbox2" code markers', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must not expose legacy variables when "use sandbox2" is specified', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute(`"use sandbox2";
                var assert = require('assert');
                assert.equal(typeof _, 'undefined', 'lodash should be undefined');
                assert.equal(typeof postman, 'undefined', 'postman legacy interface should be down');
            `, done);
        });
    });

    it('must ensure that major generic globals is still available in sandbox2 mode', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute(`"use sandbox2";
                var assert = require('assert');
                assert.equal(typeof Buffer, 'function', 'Buffer should be available');
                assert.equal(typeof pm, 'object', 'pm object should be available');
            `, done);
        });
    });

    it('must ensure that legacy test target globals are not present', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute({
                listen: 'test',
                script: `"use sandbox2";
                    var assert = require('assert');
                    assert.equal(typeof tests, 'undefined', 'test object should be undefiend');
                `
            }, done);
        });
    });

});
