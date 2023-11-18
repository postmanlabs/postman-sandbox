class ExecutionLocation extends Array {
    /**
     *
     * @param {string} current - Current item name, current item is the item whose script is being executed
     * @param  {string} rest - Arguments to pass to Array constructor
     */
    constructor (current, ...rest) {
        super(...rest);
        this._current = current;
    }

    get current () {
        return this._current;
    }
}

module.exports = ExecutionLocation;
