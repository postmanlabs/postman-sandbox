var teleportJS = require('teleport-javascript');

// @todo use sinopia
describe('console inside sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib'),
        logLevels = ['log', 'warn', 'debug', 'info', 'error'];

    logLevels.forEach(function (level) {
        it(`console.${level} must be available inside sandbox`, function (done) {
            Sandbox.createContext({
                debug: false
            }, function (err, ctx) {
                var consoleEventArgs;

                if (err) { return done(err); }

                ctx.on('error', done);
                ctx.on('console', function () {
                    consoleEventArgs = arguments;
                });

                ctx.execute(`console.${level}('hello console');`, {
                    cursor: {ref: 'cursor-identifier'}
                }, function (err) {
                    if (err) { return done(err); }
                    expect(consoleEventArgs).to.be.ok;
                    expect(consoleEventArgs[0]).be.an('object').that.has.property('ref', 'cursor-identifier');
                    expect(consoleEventArgs[0]).to.have.property('execution');
                    expect(consoleEventArgs[1]).to.equal(level);
                    expect(consoleEventArgs[2]).to.equal('hello console');
                    done();
                });
            });
        });
    });

    it('should be able to display all datatypes in console logs', function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            var logsData = {
                    regex: /a-z/g,
                    nil: null,
                    undef: undefined,
                    string: 'some str',
                    number: 1234,
                    boolean: true,
                    arr: [1, 2, 3],
                    obj: {
                        a: 1,
                        b: 2
                    },
                    inf: Infinity,
                    neginf: -Infinity,
                    map: new Map([[1, 'one'], [2, 'two']]),
                    set: new Set([1, 2, 3])
                },
                consoleEventArgs;

            if (err) {
                return done(err);
            }

            ctx.on('error', done);
            ctx.on('console', function () {
                consoleEventArgs = arguments;
            });

            ctx.execute(`console.log({
                    regex: /a-z/g,
                    nil: null,
                    undef: undefined,
                    string: 'some str',
                    number: 1234,
                    boolean: true,
                    arr: [1, 2, 3],
                    obj: {
                        a: 1,
                        b: 2
                    },
                    inf: Infinity,
                    neginf: -Infinity,
                    map: new Map([[1, 'one'], [2, 'two']]),
                    set: new Set([1, 2, 3])
                }, /a-z/g);`, {}, function (err) {

                if (err) {
                    return done(err);
                }

                expect(consoleEventArgs).to.exist;
                expect(consoleEventArgs[0]).to.be.an('object');
                expect(consoleEventArgs[1]).to.be.a('string').and.equal('log');
                expect(consoleEventArgs[2]).to.be.an('object').and.eql(logsData);
                expect(consoleEventArgs[3]).to.be.a('regexp').and.eql(/a-z/g);
                done();
            });
        });
    });

    it('should be able to revive NaN', function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            var consoleEventArgs,

                // @todo This is done because NaN is returned as undefined for
                // Node but works correctly for browser
                expectedValue = (typeof window === 'undefined') ? undefined : NaN;

            if (err) {
                return done(err);
            }

            ctx.on('error', done);
            ctx.on('console', function () {
                consoleEventArgs = arguments;
            });

            ctx.execute('console.log(NaN);', {}, function (err) {

                if (err) {
                    return done(err);
                }

                expect(consoleEventArgs).to.exist;
                expect(consoleEventArgs[0]).to.be.an('object');
                expect(consoleEventArgs[1]).to.be.a('string').and.equal('log');
                expect(consoleEventArgs[2]).to.eql(expectedValue);
                done();
            });
        });
    });

    it('should allow sending serialized logs', function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            var logsData = {
                    undef: undefined,
                    str: 'string'
                },
                expectedLogs = teleportJS.stringify([logsData]),
                consoleEventArgs;

            if (err) {
                return done(err);
            }

            ctx.on('error', done);
            ctx.on('console', function () {
                consoleEventArgs = arguments;
            });

            ctx.execute('console.log({ undef: undefined, str: "string" });', {
                serializeLogs: true
            }, function (err) {

                if (err) {
                    return done(err);
                }

                expect(consoleEventArgs).to.exist;
                expect(consoleEventArgs[0]).to.be.an('object');
                expect(consoleEventArgs[1]).to.be.a('string').and.equal('log');
                expect(consoleEventArgs[2]).to.be.a('string').and.equal(expectedLogs);
                expect(teleportJS.parse(consoleEventArgs[2])).to.eql([logsData]);
                done();
            });
        });
    });

    it('should allow calling console.log without arguments', function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            var consoleEventArgs;

            if (err) {
                return done(err);
            }

            ctx.on('error', done);
            ctx.on('console', function () {
                consoleEventArgs = arguments;
            });

            ctx.execute('console.log();', {
                serializeLogs: false
            }, function (err) {

                if (err) {
                    return done(err);
                }

                expect(consoleEventArgs).to.exist;
                expect(consoleEventArgs[0]).to.be.an('object');
                expect(consoleEventArgs[1]).to.be.a('string').and.equal('log');
                expect(consoleEventArgs[2]).to.be.undefined;
                done();
            });
        });
    });

    it('should allow calling console.log without arguments with serializeLogs options set', function (done) {
        Sandbox.createContext({}, function (err, ctx) {
            var consoleEventArgs;

            if (err) {
                return done(err);
            }

            ctx.on('error', done);
            ctx.on('console', function () {
                consoleEventArgs = arguments;
            });

            ctx.execute('console.log();', {
                serializeLogs: true
            }, function (err) {

                if (err) {
                    return done(err);
                }

                expect(consoleEventArgs).to.exist;
                expect(consoleEventArgs[0]).to.be.an('object');
                expect(consoleEventArgs[1]).to.be.a('string').and.equal('log');
                expect(consoleEventArgs[2]).to.be.a('string').and.equal('[[]]');
                done();
            });
        });
    });
});
