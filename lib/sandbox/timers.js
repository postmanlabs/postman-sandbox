var timerFunctionNames = ['Timeout', 'Interval', 'Immediate', 'Event'],
    multiFireTimerFunctions = {
        'Interval': true

    },
    staticTimerFunctions = {
        'Event': true
    },
    defaultTimers = {},
    arrayProtoSlice = Array.prototype.slice,

    Timerz; // main exports constructor

// get hold of default timer functions as available in global scope
timerFunctionNames.forEach(function (name) {
    var fnset = (new Function('return (typeof set' + name + ' === "function" ? set' + name + ' : undefined);'))(),
        fnclr = (new Function('return (typeof clear' + name + ' === "function" ? clear' + name + ' : undefined);'))();

    if (typeof fnset === 'function') {
        defaultTimers[('set' + name)] = fnset;
    }

    if (typeof fnclr === 'function') {
        defaultTimers[('clear' + name)] = fnclr;
    }
});

/**
 *
 * @constructor
 * @param {Object} [options]
 */
Timerz = function Timerz (delegations, onAnyTimerStart, onAllTimerEnd, onError) {
    var dummyContext = {},
        timers = delegations || defaultTimers,

        total = 0, // accumulator to keep track of total timers
        pending = 0, // counters to keep track of running timers
        sealed = false, // flag that stops all new timer additions
        computeTimerEvents;

    // do special handling to enable emulation of immediate timers in hosts that lacks them
    if (typeof timers.setImmediate !== 'function') {
        timers.setImmediate = function (callback) {
            return timers.setTimeout(callback, 0);
        };
        timers.clearImmediate = function (id) {
            return timers.clearTimeout(id);
        };
    }

    // handle event based timers
    if (typeof timers.setEvent !== 'function') {
        (function () {
            var events = {},
                total = 0;

            timers.setEvent = function (callback) {
                var id = ++total;
                events[id] = callback;
                return id;
            };

            timers.clearEvent = function (id) {
                var cb = events[id];
                delete events[id];

                if (typeof cb === 'function') {
                    cb.apply(dummyContext, arrayProtoSlice.call(arguments, 1));
                }
            };
        }());
    }

    // create a function
    computeTimerEvents = function (increment) {
        increment && (pending += increment);

        if (pending === 0 && computeTimerEvents.started)  {
            (typeof onAllTimerEnd === 'function') && onAllTimerEnd();
            computeTimerEvents.started = false;
            return;
        }

        if (pending > 0 && !computeTimerEvents.started) {
            (typeof onAnyTimerStart === 'function') && onAnyTimerStart();
            computeTimerEvents.started = true;
            return;
        }
    };

    timerFunctionNames.forEach(function (name) {
        // create an accumulator for all timer references
        var running = {};

        // create the setter function for the timer
        this[('set' + name)] = function (callback) {
            // it is pointless to proceed with setter if there is no callback to execute
            if (sealed || typeof callback !== 'function') {
                return;
            }

            var id = ++total, // get hold of the next timer id
                args = arrayProtoSlice.call(arguments);

            args[0] = function () {
                // call the actual callback with a dummy context
                try { callback.apply(dummyContext, staticTimerFunctions[name] ? arguments : null); }
                catch (e) { onError && onError.call(dummyContext, e); }

                // interval timers can only be cleared using clearXYZ function and hence we need not do anything
                // except call the timer
                if (staticTimerFunctions[name] || multiFireTimerFunctions[name]) {
                    // do not modify counter during interval type events
                    computeTimerEvents();
                }
                // when this is fired, the timer dies, so we decrement tracking counters and delete
                // irq references
                else {
                    computeTimerEvents(-1);
                    delete running[id];
                }
            };

            // call the underlying timer function and keep a track of its irq
            running[id] = timers[('set' + name)].apply(this, args);
            args = null; // precaution

            // increment the counter and return the tracking ID to be used to pass on to clearXYZ function
            computeTimerEvents(1);
            return id;
        };

        // create the clear function of the timer
        this[('clear' + name)] = function (id) {
            var underLyingId = running[id],
                args;

            // it is pointless and erroenous to proceed in case it seems that it is no longer running
            if (sealed || !underLyingId) {
                return;
            }

            // prepare args to be forwarded to clear function
            args = arrayProtoSlice.call(arguments);
            args[0] = underLyingId;

            // decrement counters and call the clearing timer function
            computeTimerEvents(-1);
            delete running[id];
            timers['clear' + name].apply(this, args);
            args = underLyingId = null; // just a precaution
        };

        // create a sugar function to clear all running timers of this category
        this[('clearAll' + name + 's')] = function () {
            Object.keys(running).forEach(function (id) {
                computeTimerEvents(-1);
                delete running[id];
                timers['clear' + name](running[id]);
            });
        };

    }.bind(this));

    this.queueLength = function () {
        return pending;
    };

    this.clearAll = function () {
        timerFunctionNames.forEach(function (name) {
            this[('clearAll' + name + 's')]();
        }.bind(this));
    };

    this.seal = function () {
        this.clearAll();
        sealed = true;
    };
};

module.exports = Timerz;
