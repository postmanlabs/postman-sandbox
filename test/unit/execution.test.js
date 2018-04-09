// @note: this is where we override prototype functions
// to make sure sandbox added properties do not leak
require('../../lib/sandbox/purse.js');

var _ = require('lodash'),
    Execution = require('../../lib/sandbox/execution'),
    pmAPI = require('../../lib/sandbox/pmapi'),
    execution,
    pm; // eslint-disable-line no-unused-vars


describe('execution', function () {
    before(function () {
        execution = new Execution('id', {listen: 'test'}, {}, {});
        pm = new pmAPI({}, execution, _.noop);
    });

    it('can be serialized', function () {
        var json;
        expect(function () {
            json = execution.toJSON();
        }).to.not.throwError();
        expect(json).to.have.property('request');
        expect(json).to.have.property('response');
    });

    it('does not leak sandbox helpers when serialized', function () {
        var json;

        expect(execution.request).to.have.property('to');
        expect(execution.response).to.have.property('to');

        json = execution.toJSON();

        expect(json).to.have.property('request');
        expect(json.request).to.not.have.property('to');
        expect(execution.request).to.have.property('to');
        expect(json).to.have.property('response');
        expect(json.response).to.not.have.property('to');
        expect(execution.response).to.have.property('to');
    });
});
