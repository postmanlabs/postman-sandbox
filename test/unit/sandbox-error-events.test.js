describe('sandbox error events', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('should throw generic execution.error event on error', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('execution.error', function (cursor, err) {
                expect(cursor).to.have.property('execution', 'my-execution-id');
                expect(err).to.have.property('message', 'this will regurgitate!');
                done();
            });

            ctx.execute('throw new Error("this will regurgitate!")', {
                id: 'my-execution-id'
            }); // eslint-disable-line no-empty-function
        });
    });

    it('should throw execution specific execution.error.:id event on error', function (done) {
        Sandbox.createContext(function (err, ctx) {
            if (err) { return done(err); }

            ctx.on('execution.error.my-execution-id', function (cursor, err) {
                expect(cursor).to.have.property('execution', 'my-execution-id');
                expect(err).to.have.property('message', 'this will regurgitate!');
                done();
            });

            ctx.execute('throw new Error("this will regurgitate!")', {
                id: 'my-execution-id'
            }); // eslint-disable-line no-empty-function
        });
    });
});
