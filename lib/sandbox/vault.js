let callbacksStore = require('./utils/callbacks-store');

class Vault {
    constructor (id, bridge) {
        this._bridge = bridge;
        this._event = `execution.vault.${id}`;

        this._handler = (eventId, ...args) => {
            const registeredCallbackForThisEvent = callbacksStore.getCallback(eventId);

            if (typeof registeredCallbackForThisEvent === 'function') {
                registeredCallbackForThisEvent(...args);
            }

            callbacksStore.unregisterCallback(eventId);
        };

        this._bridge.on(this._event, this._handler);
    }

    exec (...args) {
        return new Promise((resolve, reject) => {
            const eventId = callbacksStore.registerCallback((err, ...args) => {
                if (err) {
                    return reject(err instanceof Error ? err : new Error(err.message || err));
                }

                resolve(...args);
            });

            this._bridge.dispatch(this._event, eventId, ...args);
        });
    }

    dispose () {
        this._bridge.off(this._event, this._handler);
    }
}

const getVaultInterface = (vault) => {
    return {
        get: (key) => {
            return vault('get', key);
        },

        set: (key, value) => {
            return vault('set', key, value);
        },

        unset: (key) => {
            return vault('unset', key);
        }
    };
};

module.exports = {
    Vault,
    getVaultInterface
};
