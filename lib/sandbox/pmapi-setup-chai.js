var languageChains = ['be', 'have', 'include'],
    sdk = require('postman-collection'),
    chaiPostman = require('chai-postman'),
    _ = require('lodash'),
    responseAssertion,
    requestAssertion;

module.exports = function setupChai (self, chai) {
    // add response assertions
    if (self.response) {
        // these are removed before serializing see `purse.js`
        self.response.to = {not: {}};
        responseAssertion = chai.expect(self.response).to;

        // explicitly assigning chai methods to chai's 'to' and 'to.not'.
        languageChains.forEach(function eachLanguageChain (value) {
            self.response.to[value] = responseAssertion[value];
            self.response.to.not[value] = responseAssertion.not[value];
        });
    }
    // add request assertions
    if (self.request) {
        // these are removed before serializing see `purse.js`
        self.request.to = {not: {}};
        requestAssertion = chai.expect(self.request).to;

        // explicitly assigning chai methods to chai's 'to' and 'to.not'.
        languageChains.forEach(function eachLanguageChain (value) {
            self.request.to[value] = requestAssertion[value];
            self.request.to.not[value] = requestAssertion.not[value];
        });
    }

    // make chai use postman extension
    chai.use(chaiPostman(sdk, _));
};

