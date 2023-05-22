/* eslint-disable function-paren-newline */
/* eslint-disable one-var */
/**
 * @fileOverview
 *
 * This module externally sets up the test runner on pm api. Essentially, it does not know the insides of pm-api and
 * does the job completely from outside with minimal external dependency
 */
const _ = require('lodash'),
    FUNCTION = 'function',
    uuid = require('../vendor/uuid'),

    OPTIONS = {
        When: 'when',
        RunCount: 'runCount',
        RunUntil: 'runUntil'
    },
    OPTION_TYPE = {
        [OPTIONS.When]: 'function',
        [OPTIONS.RunCount]: 'number',
        [OPTIONS.RunUntil]: 'number'
    };

/**
 * @module {PMAPI~setupTestRunner}
 * @private
 *
 * @param {PMAPI} pm - an instance of PM API that it needs
 * @param {Object} testsState - State of all the tests for the current execution
 * @param {Function} onAssertion - is the trigger function that is called every time a test is encountered and it
 *                                         receives the AssertionInfo object outlining details of the assertion
 */
module.exports = function (pm, testsState, onAssertion) {
    var assertionIndex = 0,

        /**
         * Returns an object that represents data coming out of an assertion.
         *
         * @note This is put in a function since this needs to be done from a number of place and having a single
         * function reduces the chance of bugs
         *
         * @param {String} testId -
         * @param {String} name -
         * @param {Boolean} skipped -
         *
         * @returns {PMAPI~AssertionInfo}
         */
        getAssertionObject = function (testId, name, skipped) {
            /**
             * @typeDef {AssertionInfo}
             * @private
             */
            return {
                testId: testId,
                name: String(name),
                async: false,
                skipped: Boolean(skipped),
                passed: true,
                pending: !skipped,
                error: null,
                index: assertionIndex++ // increment the assertion counter (do it before asserting)
            };
        },

        generateTestId = function (eventName, testName, assertFn, options) {
            return [
                eventName,
                testName,
                assertFn ? assertFn.toString() : '',
                JSON.stringify(options)
            ].join('');
        },

        getDefaultTestState = function (options) {
            return {
                ...(options ? _.pick(options, _.values(OPTIONS)) : {}),
                testId: uuid(),
                timer: null,
                currRunCount: 0,
                pending: true
            };
        },

        isOptionConfigured = function (options, optionName) {
            return _.has(options, optionName) && typeof options[optionName] === OPTION_TYPE[optionName];
        },


        validateOptions = function (options) {
            if (!options || typeof options !== 'object') {
                throw new Error('Invalid test option: options is not an object');
            }

            const supportedOptions = _.values(OPTIONS);

            Object.keys(options).forEach((optionName) => {
                if (!supportedOptions.includes(optionName)) {
                    throw new Error(`Invalid test option: ${optionName} is not a supported option`);
                }

                if (typeof options[optionName] !== OPTION_TYPE[optionName]) {
                    throw new Error(`Invalid test options: ${optionName} is not a ${OPTION_TYPE[optionName]}`);
                }
            });
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
        },

        processAssertion = function (_testId, assertionData, options) {
            const testState = testsState[_testId];

            if (!testState.pending) {
                return;
            }

            const shouldResolve = Boolean(
                assertionData.error || // TODO: Make conditions (test status) to mark a test resolved, configurable.
                assertionData.skipped ||
                _.isEmpty(options) ||
                !testState ||
                isOptionConfigured(options, OPTIONS.RunCount) && testState.runCount === testState.currRunCount ||
                isOptionConfigured(options, OPTIONS.RunUntil) && !testState.timer
            );

            testState.pending = assertionData.pending = !shouldResolve;

            // Tests without options does not need to be tracked
            if (_.isEmpty(options)) {
                delete testsState[_testId];
            }

            onAssertion(assertionData);
        },

        processOptions = function (_testId, assertionData, options) {
            const testState = testsState[_testId],
                shouldRun = testState.pending &&
                    (isOptionConfigured(options, OPTIONS.When) ? Boolean(options.when()) : true) &&
                    (isOptionConfigured(options, OPTIONS.RunCount) ? testState.currRunCount < options.runCount : true);

            if (shouldRun) {
                testState.currRunCount++;

                const startTimer = isOptionConfigured(options, OPTIONS.RunUntil) && !testState.timer;

                if (startTimer) {
                    testState.timer = setTimeout(() => {
                        testState.timer = null;
                        processAssertion(_testId, assertionData, options);
                    }, testState.runUntil);
                }
            }

            return shouldRun;
        };

    /**
     * @param  {String} name -
     * @param  {Object} [options] -
     * @param  {Function} assert -
     * @chainable
     */
    pm.test = function (name, options, assert) {
        if (typeof options === FUNCTION) {
            assert = options;
            options = {};
        }

        if (_.isNil(options) || typeof options !== 'object') {
            options = {};
        }

        // TODO: Make generateTestId safe i.e handle invalid `options` as well
        const _testId = generateTestId(pm.info.eventName, name, assert, options);

        if (!testsState[_testId]) {
            testsState[_testId] = getDefaultTestState(options);
        }

        const testState = testsState[_testId],
            testId = testState.testId,
            assertionData = getAssertionObject(testId, name, false);

        // if there is no assertion function, we simply move on
        if (typeof assert !== FUNCTION) {
            // Sending `options` as empty to force resolve the test
            processAssertion(_testId, assertionData, {});

            return pm;
        }

        try { validateOptions(options); }
        catch (e) {
            markAssertionAsFailure(assertionData, e);
            processAssertion(_testId, assertionData, options);

            return pm;
        }


        const shouldRun = processOptions(_testId, assertionData, options);

        if (shouldRun) {
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

                        processAssertion(_testId, assertionData, options);
                    });
                }
                // in case a synchronous error occurs in the the async assertion, we still bail out.
                catch (e) {
                    markAssertionAsFailure(assertionData, e);
                    processAssertion(_testId, assertionData, options);
                }
            }
            // if the assertion function does not expect a callback, we synchronously execute the same
            else {
                try { assert(); }
                catch (e) {
                    markAssertionAsFailure(assertionData, e);
                }

                processAssertion(_testId, assertionData, options);
            }
        }
        else {
            processAssertion(_testId, assertionData, options);
        }

        return pm; // make it chainable
    };

    /**
     * @param  {String} name -
     * @chainable
     */
    pm.test.skip = function (name) {
        // trigger the assertion events with skips
        processAssertion(name, getAssertionObject(uuid(), name, true), {});

        return pm; // chainable
    };

    /**
     * @returns {Number}
     */
    pm.test.index = function () {
        return assertionIndex;
    };
};
