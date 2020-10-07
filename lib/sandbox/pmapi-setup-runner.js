/**
 * @fileOverview
 *
 * This module externally sets up the test runner on pm api. Essentially, it does not know the insides of pm-api and
 * does the job completely from outside with minimal external dependency
 */
const FUNCTION = 'function';

/**
 * @module {PMAPI~setupTestRunner}
 * @private
 *
 * @param {PMAPI} pm - an instance of PM API that it needs
 * @param {Function} onAssertionComplete - is the trigger function that is called every time a test is executed and it
 *                                         receives the AssertionInfo object outlining details of the assertion
 */
module.exports = function (pm, onAssertionComplete) {
    var assertionIndex = 0,

        /**
         * Returns an object that represents data coming out of an assertion.
         *
         * @note This is put in a function since this needs to be done from a number of place and having a single
         * function reduces the chance of bugs
         *
         * @param {String} name -
         * @param {Boolean} skipped -
         *
         * @returns {PMAPI~AssertionInfo}
         */
        getAssertionObject = function (name, skipped) {
            /**
             * @typeDef {AssertionInfo}
             * @private
             */
            return {
                name: String(name),
                async: false,
                skipped: Boolean(skipped),
                passed: true,
                error: null,
                index: assertionIndex++ // increment the assertion counter (do it before asserting)
            };
        },

        /**
         * Simple function to mark an assertion as failed
         *
         * @private
         *
         * @note This is put in a function since this needs to be done from a number of place and having a single
         * function reduces the chance of bugs
         *
         * @param {Object} assertionData -
         * @param {*} err -
         */
        markAssertionAsFailure = function (assertionData, err) {
            assertionData.error = err;
            assertionData.passed = false;
        };

    /**
     * @param  {String} name -
     * @param  {Function} assert -
     * @chainable
     */
    pm.test = function (name, assert) {
        var assertionData = getAssertionObject(name, false);

        // if there is no assertion function, we simply move on
        if (typeof assert !== FUNCTION) {
            onAssertionComplete(assertionData);

            return pm;
        }

        // if a callback function was sent, then we know that the test is asynchronous
        if (assert.length) {
            try {
                assertionData.async = true; // flag that this was an async test (would be useful later)

                // we execute assertion, but pass it a completion function, which, in turn, raises the completion
                // event. we do not need to worry about timers here since we are assuming that some timer within the
                // sandbox had actually been the source of async calls and would take care of this
                assert(function (err) {
                    // at first we double check that no synchronous error has happened from the catch block below
                    if (assertionData.error && assertionData.passed === false) {
                        return;
                    }

                    // user triggered a failure of the assertion, so we mark it the same
                    if (err) {
                        markAssertionAsFailure(assertionData, err);
                    }

                    onAssertionComplete(assertionData);
                });
            }
            // in case a synchronous error occurs in the the async assertion, we still bail out.
            catch (e) {
                markAssertionAsFailure(assertionData, e);
                onAssertionComplete(assertionData);
            }
        }
        // if the assertion function does not expect a callback, we synchronously execute the same
        else {
            try { assert(); }
            catch (e) {
                markAssertionAsFailure(assertionData, e);
            }

            onAssertionComplete(assertionData);
        }

        return pm; // make it chainable
    };

    /**
     * @param  {String} name -
     * @chainable
     */
    pm.test.skip = function (name) {
        // trigger the assertion events with skips
        onAssertionComplete(getAssertionObject(name, true));

        return pm; // chainable
    };

    /**
     * @returns {Number}
     */
    pm.test.index = function () {
        return assertionIndex;
    };
};
