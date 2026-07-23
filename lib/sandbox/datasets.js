class Datasets {
    constructor (id, bridge, timers) {
        this._bridge = bridge;
        this._timers = timers;
        this._event = `execution.datasets.${id}`;

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

    /**
     * Async generator that pulls rows one batch at a time from the host, keeping
     * memory bounded end to end. Each `__pull` is a request/response over the
     * existing bridge; the host serves the next batch from the open engine
     * cursor it holds for `streamId`, marking `done` on the final frame. If the
     * consumer stops early (breaks the `for await`), `__cancel` releases the
     * host-side cursor.
     *
     * @param {String} streamId - identifies the open host-side cursor to pull from
     * @returns {AsyncGenerator} - yields one row object at a time until `done`
     */
    streamRows (streamId) {
        const self = this;

        return (async function *() {
            let done = false;

            try {
                while (!done) {
                    // Batches are pulled sequentially — each __pull advances the
                    // one host-side cursor, so the await must serialize.
                    // eslint-disable-next-line no-await-in-loop
                    const frame = await self.exec('__pull', null, streamId),
                        rows = (frame && frame.rows) || [];

                    for (let i = 0; i < rows.length; i++) {
                        yield rows[i];
                    }

                    done = Boolean(frame && frame.done);
                }
            }
            finally {
                // Best-effort release when the consumer breaks before `done`.
                if (!done) { self.exec('__cancel', null, streamId).catch(() => { /* noop */ }); }
            }
        }());
    }

    dispose () {
        this._bridge.off(this._event, this._handler);
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
            // streamId }` and serves rows on demand via `__pull`. Non-streaming
            // reply: rows is a materialised array (back-compat). Either way the
            // script sees the same `AsyncIterable`.
            rows: result && result.streaming ?
                datasets.streamRows(result.streamId) :
                iterateRows(Array.isArray(rows) ? rows : [])
        };

    if (result && result.staleDatasources) {
        wrapped.staleDatasources = result.staleDatasources;
    }

    return wrapped;
}

const getDatasetsInterface = (datasets) => {
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
};

module.exports = {
    Datasets,
    getDatasetsInterface
};
