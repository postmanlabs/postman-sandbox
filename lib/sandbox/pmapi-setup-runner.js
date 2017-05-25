var FUNCTION = 'function';

module.exports = function (pm, onAssertion) {
    var assertionIndex = 0;

    /**
     * @param  {String} name
     * @param  {Function} assert
     * @chainable
     */
    pm.test = function (name, assert) {

        if (typeof assert !== FUNCTION) {
            return;
        }

        var eventArgs = {
            name: name,
            passed: true,
            error: null,
            index: assertionIndex++ // increment the assertion counter (do it before asserting)
        };

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
        onAssertion({
            name: name,
            skipped: true,
            passed: true,
            error: null,
            index: ++assertionIndex // increment the assertion counter (do it before asserting)
        });

        return pm; // chainable
    };
};
