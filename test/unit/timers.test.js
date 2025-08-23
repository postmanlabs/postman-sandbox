describe('timers module', function () {
    this.timeout(1000 * 60);
    var Timers = require('../../lib/sandbox/timers');

    it('should be able to set an event', function (done) {
        var executionId = '1',
            status = 'uneventful',
            timers,
            id;

        timers = new Timers(executionId, null, done, null, function () {
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
