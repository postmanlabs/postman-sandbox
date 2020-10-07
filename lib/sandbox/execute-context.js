const _ = require('lodash'),
    legacy = require('./postman-legacy-interface'),

    NONLEGACY_SANDBOX_MARKERS = {
        '"use sandbox2";': true,
        '\'use sandbox2\';': true
    };

module.exports = function (scope, code, execution, console, timers, pmapi, onAssertion) {
    // if there is no code, then no point bubbling anything up
    if (!(code && _.isString(code))) {
        return timers.terminate();
    }

    // start by resetting the scope
    scope.reset();

    if (NONLEGACY_SANDBOX_MARKERS[code.substr(0, 15)]) {
        // ensure any previously added global variables from legacy are torn down. side-effect is that if user
        // explicitly created global variables with same name as legacy ones, they will be torn down too!
        // for that reason, the setup function tags the scope and avoids tearing down an scope that was never setup
        legacy.teardown(scope);
    }
    else {
        // prepare legacy environment, which adds a tonne of global variables
        legacy.setup(scope, execution);
    }

    // prepare the scope's environment variables
    scope.import({
        Buffer: require('buffer').Buffer,
        // forward console
        console: console,
        // forward pm-api instance
        /**
         * The pm object encloses all information pertaining to the script being executed and
         * allows one to access a copy of the request being sent or the response received.
         * It also allows one to get and set environment and global variables.
         *
         * @type {Postman}
         */
        pm: pmapi,
        // import the timers
        setTimeout: timers.setTimeout,
        setInterval: timers.setInterval,
        setImmediate: timers.setImmediate,
        clearTimeout: timers.clearTimeout,
        clearInterval: timers.clearInterval,
        clearImmediate: timers.clearImmediate
    });

    scope.exec(code, function (err) {
        // we check if the execution went async by determining the timer queue length at this time
        execution.return.async = (timers.queueLength() > 0);

        // call this hook to perform any post script execution tasks
        legacy.finish(scope, pmapi, onAssertion);

        // if timers are running, we do not need to proceed with any logic of completing execution. instead we wait
        // for timer completion callback to fire
        if (execution.return.async) {
            return err && timers.error(err); // but if we had error, we pass it to async error handler
        }

        // at this stage, the script is a synchronous script, we simply forward whatever has come our way
        timers.terminate(err);
    });
};
