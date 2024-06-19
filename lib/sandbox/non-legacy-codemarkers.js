const NONLEGACY_SANDBOX_MARKERS = {
    '"use sandbox2";': true,
    '\'use sandbox2\';': true
};

module.exports = {
    isNonLegacySandbox (code) {
        return NONLEGACY_SANDBOX_MARKERS[code.substr(0, 15)];
    },

    getNonLegacyCodeMarker () {
        return Object.keys(NONLEGACY_SANDBOX_MARKERS)[0];
    }
};
