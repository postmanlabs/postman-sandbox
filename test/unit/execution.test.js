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
        execution = new Execution('id', { listen: 'test' }, {}, {});
        pm = new pmAPI(execution, _.noop, _.noop); // eslint-disable-line no-unused-vars
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

        expect(execution).to.have.nested.property('request.to');
        expect(execution).to.have.nested.property('response.to');

        json = execution.toJSON();

        expect(json).to.not.have.nested.property('request.to');
        expect(execution).to.have.nested.property('request.to');
        expect(json).to.not.have.nested.property('response.to');
        expect(execution).to.have.nested.property('response.to');
    });

    it('does not freeze or reuse the caller report object', function () {
        var callerReport = { summary: { requests: 42 } },
            reportExecution = new Execution('id', { listen: 'test' }, { report: callerReport }, {});

        expect(reportExecution.report).to.not.equal(callerReport);
        expect(Object.isFrozen(reportExecution.report)).to.be.true;
        expect(Object.isFrozen(reportExecution.report.summary)).to.be.true;
        expect(Object.isFrozen(callerReport)).to.be.false;
        expect(Object.isFrozen(callerReport.summary)).to.be.false;

        callerReport.summary.requests = 100;
        expect(reportExecution.report.summary.requests).to.equal(42);
    });

    it('does not include the report when serialized', function () {
        var reportExecution = new Execution('id', { listen: 'test' }, {
                report: { summary: { requests: 42 } }
            }, {}),
            json = reportExecution.toJSON();

        expect(reportExecution).to.have.own.property('report');
        expect(json).to.not.have.own.property('report');
    });

    it('rejects report accessors without invoking them', function () {
        var accessorInvoked = false,
            callerReport = {};

        Object.defineProperty(callerReport, 'summary', {
            enumerable: true,
            get: function () {
                accessorInvoked = true;

                return {};
            }
        });

        expect(function () {
            new Execution('id', { listen: 'test' }, { report: callerReport }, {}); // eslint-disable-line no-new
        }).to.throw(TypeError, 'sandbox: report contains an accessor');
        expect(accessorInvoked).to.be.false;
    });

    it('rejects a report whose root is not a JSON object or null', function () {
        expect(function () {
            new Execution('id', { listen: 'test' }, { report: [] }, {}); // eslint-disable-line no-new
        }).to.throw(TypeError, 'sandbox: report must be a JSON object or null');
    });
});
