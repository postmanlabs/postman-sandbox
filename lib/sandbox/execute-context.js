var _ = require('lodash'),
    PostmanAPI = require('./pmapi'),
    legacy = require('./postman-legacy-interface'),

    NONLEGACY_SANDBOX_MARKERS = {
        '"use sandbox2";': true,
        '\'use sandbox2\';': true
    };

module.exports = function (scope, code, execution, console, timers) {
    // if there is no code, then no point bubbling anything up
    if (!(code && _.isString(code))) {
        return timers.terminate();
    }

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
        // if a console is sent, we use it. otherwise this also prevents erroneous referencing to any console inside
        // this closure.
        console: console,
        pm: new PostmanAPI(bridge, execution),
        // import the timers
        setTimeout: timers.setTimeout,
        setInterval: timers.setInterval,
        setImmediate: timers.setImmediate,
        clearTimeout: timers.clearTimeout,
        clearInterval: timers.clearInterval,
        clearImmediate: timers.clearImmediate
    });

    scope.exec(code, function (err) {
        // we check if the execution wehnt async by determining the timer queue length at this time
        execution.return.async = (timers.queueLength() > 0);

        // if timers are running, we do not need to proceed with any logic of completing execution. instead we wait
        // for timer completion callback to fire
        if (execution.return.async) {
            return err && timers.error(err); // but if we had error, we pass it to async error handler
        }

        // at this stage, the script is a synchronous script, we simply forward whatever has come our way
        timers.terminate(err);
    });
};
