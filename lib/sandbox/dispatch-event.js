/**
 * Why Do we need this wrapper?
 * Because when user executes pm.request.stopExecution(), we need to stop the execution of the current request.
 * But, we don't stop the execution of the script. We just stop sending events to the bridge.
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
