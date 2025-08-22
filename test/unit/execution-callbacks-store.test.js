const executionCallbacksStore = require('../../lib/sandbox/utils/callbacks-store');

describe('execution-callbacks store', function () {
    it('should be able to set and receive a callback with an event id', function (done) {
        const eventId = '<sample-event-id>',
            callback = function () {
                //
            };

        executionCallbacksStore.registerCallback(eventId, callback);

        expect(executionCallbacksStore.getCallback(eventId)).to.be.eql(callback);

        executionCallbacksStore.unregisterCallback(eventId);

        expect(executionCallbacksStore.getCallback(eventId)).to.be.undefined;

        done();
    });
});
