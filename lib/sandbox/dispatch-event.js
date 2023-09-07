/**
 *
 * @param {any} bridge - the bridge object
 * @param {{ shouldSkipExecution: boolean }} execution - the execution object
 * @param {string} event - the event name
 * @param  {...any} args - the arguments to be passed to the event
 */
module.exports = function dispatchEvent (bridge, execution, event, ...args) {
    // if the execution is skipped, do not dispatch the event
    if (execution && execution.shouldSkipExecution) {
        return;
    }

    bridge.dispatch(event, ...args);
};
