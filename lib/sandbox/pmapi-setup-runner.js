var FUNCTION = 'function';

module.exports = function (pm, execution, onAssertion) {
    /**
     * @param  {String} name
     * @param  {Function} assert
     * @chainable
     */
    pm.test = function (name, assert) {
        var eventArgs = execution.getAssertionObject(name, false);

        try { (typeof assert === FUNCTION) && assert(); }
        catch (e) {
            eventArgs.error = e;
            eventArgs.passed = false;
        }

        onAssertion(eventArgs);
        return pm; // make it chainable
    };

    pm.test.skip = function (name) {
        // trigger the assertion events with skips
        onAssertion(execution.getAssertionObject(name, true));
        return pm; // chainable
    };
};
