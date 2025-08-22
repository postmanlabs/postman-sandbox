const _ = require('lodash');

class CallbackStore {
    callbacks = new Map();

    getCallback (eventId) {
        return this.callbacks.get(eventId);
    }

    registerCallback (callback) {
        const eventId = _.uniqueId('event_');

        this.callbacks.set(eventId, callback);

        return eventId;
    }

    unregisterCallback (eventId) {
        this.callbacks.delete(eventId);
    }
}

module.exports = new CallbackStore();
