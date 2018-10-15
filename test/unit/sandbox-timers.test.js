(typeof window === 'undefined' ? describe : describe.skip)('timers inside sandbox', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../lib'),
        ctx;

    beforeEach(function (done) {
        Sandbox.createContext({debug: true}, function (err, context) {
            if (err) { return done(err); }
            ctx = context;
            done();
        });
    });

    afterEach(function () {
        ctx.dispose();
        ctx = null;
    });


    it('should work with setTimeout inside sandbox', function (done) {
        ctx.execute(`
            var startTime = Date.now();
            setTimeout(function () {
                pm.globals.set('timeout', Date.now() - startTime, 'number');
            }, 100);
        `, {
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }

            expect(err).to.be.null;
            expect(res).to.nested.include({
                'return.async': true
            });

            expect(res).to.have.property('globals').that.has.property('values').that.is.an('array');
            expect(res.globals.values[0].value).to.be.greaterThan(95);
            done();
        });
    });

    it('should be able to clear timeout', function (done) {
        var timeoutExecuted = 'timeout not executed';

        ctx.on('console', function (cursor, level, message) { // keep track of intervals passed
            if (message === 'timeout') { timeoutExecuted = 'timeout executed'; }
        });

        ctx.execute(`
            var id = setTimeout(function () {
                console.log('timeout');
            }, 100);
            clearTimeout(id);
        `, {
            // debug: false,
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }

            expect(err).to.be.null;
            expect(res).to.nested.include({
                'return.async': false
            });

            // we wait for a while to ensure that the timeout was actually cleared.
            setTimeout(function () {
                expect(timeoutExecuted).to.eql('timeout not executed');
                done();
            }, 150);
        });
    });

    it('should work with setImmediate inside sandbox', function (done) {
        ctx.execute(`
            var startTime = Date.now();
            setImmediate(function () {
                pm.globals.set('executed', 1, 'boolean');
            });
        `, {
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }

            expect(err).to.be.null;
            expect(res).to.nested.include({
                'return.async': true
            });

            expect(res).to.have.property('globals').that.has.property('values').that.is.an('array');
            expect(res).to.nested.include({
                'globals.values[0].value': true
            });
            done();
        });
    });

    it('should be able to clear immediates', function (done) {
        var status = 'not executed';

        ctx.on('console', function (cursor, level, message) { // keep track of executions passed
            if (message === 'executed') { status = 'executed'; }
        });

        ctx.execute(`
            var id = setImmediate(function () {
                console.log('executed');
            });
            clearImmediate(id);
        `, {
            debug: false,
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }

            expect(err).to.be.null;
            expect(res).to.nested.include({
                'return.async': false
            });

            // we wait for a while to ensure that the timeout was actually cleared.
            setTimeout(function () {
                expect(status).to.eql('not executed');
                done();
            }, 150);
        });
    });

    it('should time out if timers run beyond interval and stop the interval', function (done) {
        var count = {
            terminal: null,
            current: 0
        };

        ctx.on('console', function (cursor, level, message) { // keep track of intervals passed
            if (message === 'interval') { count.current++; }
        });

        ctx.execute(`
            var startTime = Date.now();
            setInterval(function () {
                console.log('interval')
            }, 50);
        `, {
            debug: false,
            timeout: 125
        }, function (err, res) {
            count.terminal = count.current;

            expect(err).to.deep.include({
                name: 'Error',
                message: 'sandbox: asynchronous script execution timeout'
            });
            expect(res).to.nested.include({
                'return.async': true
            });

            // now wait for a while to ensure no extra interval timers were fired
            setTimeout(function () {
                expect(count).to.have.property('current', count.terminal);
                done();
            }, 250);
        });
    });

    it('should be able to clear intervals and exit', function (done) {
        var status = 0;

        ctx.on('console', function (cursor, level, message) { // keep track of executions passed
            if (message === 'executed') { status += 1; }
        });

        ctx.execute(`
            var id = setInterval(function () {
                console.log('executed');
            }, 25);
            setTimeout(function() {
                clearInterval(id);
            }, 155);
        `, {
            debug: false,
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }
            var currentCount = status;

            expect(err).to.be.null;
            expect(res).to.nested.include({
                'return.async': true
            });
            expect(currentCount).to.be.above(0);

            setTimeout(function () {
                expect(status).to.equal(currentCount);
                done();
            }, 200);
        });
    });

    it('should wait for the longest running timer if multiple ones are running', function (done) {
        var order = [],
            e1 = 'executed1',
            e2 = 'executed2';

        ctx.on('console', function (cursor, level, message) { // keep track of executions passed
            if (message === e1) {
                order.push(e1);
            }
            else if (message === e2) {
                order.push(e2);
            }
            else {
                order.push('error'); // this will ensure the test fails
            }
        });

        ctx.execute(`
            setTimeout(function () {
                console.log('${e1}');
            }, 25);

            setTimeout(function(executed2) {
                console.log('${e2}');
            }, 100)
        `, {
            debug: false,
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }
            setTimeout(function () {
                expect(res).to.nested.include({
                    'return.async': true
                });
                expect(order).to.eql([e1, e2]);
                done();
            }, 200);
        });
    });

    it('should ensure that no timers are called after the timeout is reached', function (done) {
        var order = [],
            e1 = 'executed1',
            e2 = 'executed2';

        ctx.on('console', function (cursor, level, message) { // keep track of executions passed
            if (message === e1) {
                order.push(e1);
            }
            else if (message === e2) {
                order.push(e2);
            }
            else {
                order.push('error'); // this will ensure the test fails
            }
        });

        ctx.execute(`
            setTimeout(function () {
                console.log('${e1}');
            }, 25);

            setTimeout(function(executed2) {
                console.log('${e2}'); // this should never run.
            }, 300)
        `, {
            debug: false,
            timeout: 200
        }, function (err, res) {
            setTimeout(function () {
                expect(err).to.be.ok;
                expect(err.message).to.match(/timeout/);

                expect(res).to.nested.include({
                    'return.async': true
                });
                expect(order).to.eql([e1]);
                done();
            }, 500);
        });
    });

    it('should allow setting timers inside timers', function (done) {
        var msg = 'message-from-the-other-side',
            status = false;

        ctx.on('console', function (cursor, level, message) { // keep track of executions passed
            if (message === msg && !status) {
                // only do this if the status is not already true, to ensure a single call.
                status = true;
            }
            else {
                status = false;
            }
        });

        ctx.execute(`
            setTimeout(function () {
                setTimeout(function() {
                    console.log('${msg}');
                }, 25);
            }, 25);
        `, {
            debug: false,
            timeout: 200
        }, function (err, res) {
            if (err) { return done(err); }

            setTimeout(function () {
                expect(res).to.nested.include({
                    'return.async': true
                });
                expect(status).to.be.true;
                done();
            }, 500);
        });
    });

    it('should allow async tests', function (done) {
        var testName = 'postman-sb-test',
            result;

        ctx.on('execution.assertion', function (execution, tests) {
            result = tests[0];
        });

        ctx.execute(`
            setTimeout(function () {
                pm.test('${testName}', function () {
                    pm.expect(100).to.eql(100);
                });
            }, 25);
        `, {
            debug: false,
            timeout: 200
        }, function (err, execution) {
            if (err) { return done(err); }

            setTimeout(function () {
                expect(execution).to.nested.include({
                    'return.async': true
                });
                expect(result).to.eql({
                    name: 'postman-sb-test',
                    skipped: false,
                    passed: true,
                    error: null,
                    index: 0
                });
                done();
            }, 500);
        });
    });
});
