const executionCallbacksStore = require('../../lib/sandbox/utils/callbacks-store');

describe('execution-callbacks store', function () {
    it('should be able to set and receive a callback with an event id', function (done) {
        const callback = function () {
                //
            },
            eventId = executionCallbacksStore.registerCallback(callback);

        expect(typeof eventId).to.be.eql('string');

        expect(eventId.startsWith('event_')).to.be.true;

        expect(executionCallbacksStore.getCallback(eventId)).to.be.eql(callback);

        executionCallbacksStore.unregisterCallback(eventId);

        expect(executionCallbacksStore.getCallback(eventId)).to.be.undefined;

        done();
    });
});
