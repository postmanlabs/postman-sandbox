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
        }).to.not.throw();
        expect(json).to.include.keys(['request', 'response']);
    });

    it('does not leak sandbox helpers when serialized', function () {
        var json;

        expect(execution).to.have.property('request').that.has.property('to');
        expect(execution).to.have.property('response').that.has.property('to');

        json = execution.toJSON();

        expect(json).to.have.property('request').that.not.have.property('to');
        expect(execution).to.have.property('request').that.has.property('to');
        expect(json).to.have.property('response').that.not.have.property('to');
        expect(execution).to.have.property('response').that.has.property('to');
    });
});
