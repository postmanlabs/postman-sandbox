var expect = require('chai').expect,
    _ = require('lodash');

describe('sandbox with errors in scripts', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must expose error id in cursor for errors in sync scripts', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute({
                script: {
                    id: 'my-script-id',
                    type: 'text/javascript',
                    exec: `
                        throw new Error('yes');
                `}}, {cursor: {}}, function (error, execution) {
                expect(execution.cursor).to.have.property('scriptId', 'my-script-id');
                done();
            });
        });
    });

    it('must expose error id in cursor for errors in async errors', function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            if (err) { return done(err); }

            ctx.execute({
                script: {
                    id: 'my-script-id',
                    type: 'text/javascript',
                    exec: `
                        setTimeout(function() {
                            throw new Error('yeah!');
                        }, 100);
                `}}, {cursor: {}}, _.noop);

            ctx.on('execution.error', function (cursor) {
                expect(cursor).to.have.property('scriptId', 'my-script-id');
                done();
            });
        });
    });
});
