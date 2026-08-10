class Vault {
    #bridge;
    #timers;
    #event;
    #handler;

    constructor (id, bridge, timers) {
        this.#bridge = bridge;
        this.#timers = timers;
        this.#event = `execution.vault.${id}`;

        this.#handler = (eventId, ...args) => {
            this.#timers.clearEvent(eventId, ...args);
        };

        this.#bridge.on(this.#event, this.#handler);
    }

    exec (...args) {
        return new Promise((resolve, reject) => {
            const eventId = this.#timers.setEvent((err, ...args) => {
                if (err) {
                    return reject(err instanceof Error ? err : new Error(err.message || err));
                }

                resolve(...args);
            });

            this.#bridge.dispatch(this.#event, eventId, ...args);
        });
    }

    dispose () {
        this.#bridge.off(this.#event, this.#handler);
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
