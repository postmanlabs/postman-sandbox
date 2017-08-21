// @todo use sinopia
describe('console inside sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib');

    it('must be available inside sandbox', function (done) {
        Sandbox.createContext({
            debug: false
        }, function (err, ctx) {
            var consoleEventArgs;

            if (err) { return done(err); }

            ctx.on('error', done);
            ctx.on('console', function () {
                consoleEventArgs = arguments;
            });

            ctx.execute(`
                console.log('hello console');
            `, {
                    cursor: {
                        ref: 'cursor-identifier'
                    }
                }, function (err) {
                    if (err) { return done(err); }
                    expect(consoleEventArgs).be.ok();
                    expect(consoleEventArgs[0]).be.an('object');
                    expect(consoleEventArgs[0]).have.property('ref', 'cursor-identifier');
                    expect(consoleEventArgs[0]).have.property('execution');
                    expect(consoleEventArgs[1]).be('log');
                    expect(consoleEventArgs[2]).be('hello console');
                    done();
                });
        });
    });
});
