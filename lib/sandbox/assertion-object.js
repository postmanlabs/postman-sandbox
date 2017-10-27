var assertionIndex = 0,

    getAssertionObject = function (name, skipped, failed) {
        return {
            name: String(name),
            skipped: Boolean(skipped),
            passed: !failed,
            error: null,
            index: assertionIndex++ // increment the assertion counter (do it before asserting)
        };
    };

module.exports = {
    getAssertionObject: getAssertionObject
};
