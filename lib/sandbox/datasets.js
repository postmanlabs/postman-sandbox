const EXECUTION_DATASETS_EVENT_BASE = 'execution.datasets.',
    EXECUTION_DATASETS_STREAM_EVENT_BASE = 'execution.datasets.stream.';

class Datasets {
    #bridge;
    #timers;
    #event;
    #streamEvent;
    #handler;

    constructor (id, bridge, timers) {
        this.#bridge = bridge;
        this.#timers = timers;

        // Dataset commands: `(cmd, datasetId, ...args)`.
        this.#event = EXECUTION_DATASETS_EVENT_BASE + id;

        // Stream control: `(action, streamId)`, on its own channel.
        this.#streamEvent = EXECUTION_DATASETS_STREAM_EVENT_BASE + id;

        this.#handler = (eventId, ...args) => {
            this.#timers.clearEvent(eventId, ...args);
        };

        this.#bridge.on(this.#event, this.#handler);
        this.#bridge.on(this.#streamEvent, this.#handler);
    }

    /**
     * Run a dataset command on the host.
     *
     * @param {...*} args - `(cmd, datasetId, ...cmdArgs)`
     * @returns {Promise} resolves with the host's reply
     */
    exec (...args) {
        return this.#request(this.#event, args);
    }

    /**
     * Dispatch on `event` and resolve with the host's reply, correlated by event id.
     *
     * @private
     * @param {String} event - the bridge channel to dispatch on
     * @param {Array} args - arguments to forward after the event id
     * @returns {Promise} resolves with the host's reply, rejects with its error
     */
    #request (event, args) {
        return new Promise((resolve, reject) => {
            const eventId = this.#timers.setEvent((err, ...result) => {
                if (err) {
                    return reject(err instanceof Error ? err : new Error(err.message || err));
                }

                resolve(...result);
            });

            this.#bridge.dispatch(event, eventId, ...args);
        });
    }

    /**
     * Async generator that pulls rows one batch at a time from the host, keeping
     * memory bounded end to end. Each pull is a request/response on the stream
     * channel; the host serves the next batch from the open engine cursor it holds
     * for `streamId` and marks `done` on the final frame. If the consumer stops
     * early (breaks the `for await`), a cancel releases that cursor.
     *
     * @param {String} streamId - identifies the open host-side cursor to pull from
     * @returns {AsyncGenerator} - yields one row object at a time until `done`
     */
    streamRows (streamId) {
        const self = this;

        return (async function *() {
            if (!streamId) {
                throw new Error('pm.datasets: streamed result is missing a stream id');
            }

            let done = false;

            try {
                while (!done) {
                    // Batches are pulled sequentially — each pull advances the one
                    // host-side cursor, so the await must serialize.
                    // eslint-disable-next-line no-await-in-loop
                    const frame = await self.#request(self.#streamEvent, ['pull', streamId]),
                        rows = (frame && frame.rows) || [];

                    // Read `done` before yielding: a consumer that breaks part-way
                    // through the final frame must not then cancel a stream the host
                    // has already closed.
                    done = Boolean(frame && frame.done);

                    for (let i = 0; i < rows.length; i++) {
                        yield rows[i];
                    }
                }
            }
            finally {
                // Best-effort release when the consumer breaks before `done`.
                if (!done) {
                    self.#request(self.#streamEvent, ['cancel', streamId]).catch(() => { /* noop */ });
                }
            }
        }());
    }

    dispose () {
        this.#bridge.off(this.#event, this.#handler);
        this.#bridge.off(this.#streamEvent, this.#handler);
    }
}

async function *iterateRows (rows) {
    for (const row of rows) {
        yield row;
    }
}

function wrapQueryResult (result, datasets) {
    const rows = result && result.rows,
        wrapped = {
            columns: (result && result.columns) || [],
            // Streaming reply: the host sends a head frame `{ columns, streaming,
            // streamId }` and serves rows on demand over the stream channel.
            // Non-streaming reply: rows is a materialised array (back-compat).
            // Either way the script sees the same `AsyncIterable`.
            rows: result && result.streaming ?
                datasets.streamRows(result.streamId) :
                iterateRows(Array.isArray(rows) ? rows : [])
        };

    if (result && result.staleDatasources) {
        wrapped.staleDatasources = result.staleDatasources;
    }

    return wrapped;
}

function getDatasetsInterface (datasets) {
    return function (datasetId) {
        return {
            executeView: async (viewId, params) => {
                const result = await datasets.exec('executeView', datasetId, viewId, params);

                return wrapQueryResult(result, datasets);
            },

            executeQuery: async (sql, params) => {
                const result = await datasets.exec('executeQuery', datasetId, sql, params);

                return wrapQueryResult(result, datasets);
            }
        };
    };
}

module.exports = {
    Datasets,
    getDatasetsInterface
};
