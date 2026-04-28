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

    dispose () {
        this._bridge.off(this._event, this._handler);
    }
}

async function* iterateRows (rows) {
    for (const row of rows) yield row;
}

function wrapQueryResult (result) {
    return {
        columns: (result && result.columns) || [],
        staleDatasources: result && result.staleDatasources,
        rows: iterateRows((result && result.rows) || [])
    };
}

const getDatasetsInterface = (datasets) => {
    return function (datasetId) {
        return {
            addView: (options) => {
                return datasets('addView', datasetId, options);
            },

            executeView: async (viewId, params) => {
                const result = await datasets('executeView', datasetId, viewId, params);

                return wrapQueryResult(result);
            },

            executeQuery: async (sql, params) => {
                const result = await datasets('executeQuery', datasetId, sql, params);

                return wrapQueryResult(result);
            }
        };
    };
};

module.exports = {
    Datasets,
    getDatasetsInterface
};
