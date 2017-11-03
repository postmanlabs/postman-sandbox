var FUNCTION = 'function';

module.exports = function (pm, onAssertion) {
    var assertionIndex = 0,
        getAssertionObject = function (name, skipped) {
            return {
                name: String(name),
                skipped: Boolean(skipped),
                passed: true,
                error: null,
                index: assertionIndex++ // increment the assertion counter (do it before asserting)
            };
        };

    /**
     * @param  {String} name
     * @param  {Function} assert
     * @chainable
     */
    pm.test = function (name, assert) {
        var eventArgs = getAssertionObject(name, false);

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
        onAssertion(getAssertionObject(name, true));
        return pm; // chainable
    };

    pm.test.index = function () {
        return assertionIndex;
    };
};
