var getAssertionObject = require('./assertion-object').getAssertionObject,

    FUNCTION = 'function';

module.exports = function (pm, onAssertion) {
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
};
