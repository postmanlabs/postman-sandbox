var xml2js = require('xml2js'),

    /**
     * @constant
     * @type {Object}
     */
    xml2jsOptions = {
        explicitArray: false,
        // this ensures that it works in the sync sandbox we currently have in the app
        async: false,
        trim: true,
        mergeAttrs: false
    };

module.exports = function (string) {
    var JSON = {};

    // eslint-disable-next-line handle-callback-err
    xml2js.parseString(string, xml2jsOptions, function (err, result) { // @todo - see who swallows the error
        JSON = result;
    });

    return JSON;
};
