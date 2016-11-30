/**
 * Error message to trigger if bundling is accidentally triggered inside a browser
 *
 * @constant
 * @private
 * @type {String}
 */
var ERROR_MESSAGE = 'sandbox: code bundling is not supported in browser. use cached templates.',
    StubBundle;

StubBundle = function StubBundle () {
    throw new Error(ERROR_MESSAGE);
};

StubBundle.load = function () {
    throw new Error(ERROR_MESSAGE);
};

module.exports = StubBundle;
