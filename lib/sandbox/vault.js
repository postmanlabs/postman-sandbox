class Vault {
    constructor (id, bridge, timers) {
        this._bridge = bridge;
        this._timers = timers;
        this._event = `execution.vault.${id}`;

        this._handler = (eventId, ...args) => {
            this._timers.clearEvent(eventId, ...args);
        };

        this._bridge.on(this._event, this._handler);
    }

    exec (...args) {
        return new Promise((resolve, reject) => {
            const eventId = this._timers.setEvent((err, ...args) => {
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
