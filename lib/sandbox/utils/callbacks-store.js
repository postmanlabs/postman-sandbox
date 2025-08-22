class CallbackStore {
    callbacks = new Map();

    getCallback (eventId) {
        return this.callbacks.get(eventId);
    }

    registerCallback (eventId, callback) {
        this.callbacks.set(eventId, callback);
    }

    unregisterCallback (eventId) {
        this.callbacks.delete(eventId);
    }
}

module.exports = new CallbackStore();
