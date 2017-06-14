describe('timers module', function () {
    this.timeout(1000 * 60);
    var Timers = require('../../lib/sandbox/timers');

    it('must be able to set an event', function (done) {
        var status = 'uneventful',
            timers,
            id;

        timers = new Timers(null, done, null, function () {
            expect(status).to.eql('eventful');
            done();
        });

        id = timers.setEvent(function (msg) {
            status = msg;
        });

        setTimeout(function () {
            timers.clearEvent(id, 'eventful');
        }, 10);
    });
});
