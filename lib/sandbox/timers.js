/**
 * @fileoverview This file contains the module that is required to enable specialised timers that have better control
 * on a global level.
 *
 * @todo - the architecture of this sucks even if this "works".
 *       - the way to compute firing of start and end events suck
 *       - basically this needs a redo with more "engineering" put into it
 */
var /**
     *
     * @constant {String}
     */
    FUNCTION = 'function',

    /**
     * The set of timer function names. We use this array to define common behaviour of all setters and clearer timer
     * functions
     * @constant {Array.<String>}
     */
    timerFunctionNames = ['Timeout', 'Interval', 'Immediate', 'Event'],

    /**
     * This object defines a set of timer function names that are trigerred a number of times instead of a single time.
     * Such timers, when placed in generic rules, needs special attention.
     * @constant {Array.<Boolean>}
     */
    multiFireTimerFunctions = {
        'Interval': true
    },

    /**
     * This object defines a set of function timer names that do not fire based on any pre-set duration or interval.
     * Such timers, when placed in generic rules, needs special attention.
     * @constant {Array.<Boolean>}
     */
    staticTimerFunctions = {
        'Event': true
    },

    /**
     * A local copy of Slice function of Array
     * @constant {Function}
     */
    arrayProtoSlice = Array.prototype.slice,

    /**
     * This object holds the current global timers
     * @extends Timers
     *
     * @note This is a very important piece of code from compatibility standpoint.
     * The global timers need to be returned as a function that does not hold reference to the scope
     * and does not retain references to scope. Aditionally, the invocation of the timer function is
     * done without changing the scope to avoid Illegal Invocation errors.
     *
     * `timerFunctionNames` returns the suffixes of all timer operations that needs a
     * a setter and clear method.
     */
    defaultTimers = timerFunctionNames.reduce(function (timers, name) {
        var

            /**
             * Check if global setter function is available
             * @private
             * @type {Boolean}
             */
            // eslint-disable-next-line no-new-func
            isGlobalSetterAvailable = (new Function(`return typeof set${name} === 'function'`))(),

            /**
             * Check if global clear function is available
             * @private
             * @type {Boolean}
             */
            // eslint-disable-next-line no-new-func
            isGlobalClearAvailable = (new Function(`return typeof clear${name} === 'function'`))();

        if (isGlobalSetterAvailable) {
            // eslint-disable-next-line no-new-func
            timers[('set' + name)] = (new Function(`return function (fn, ms) { return set${name}(fn, ms); }`))();
        }

        if (isGlobalClearAvailable) {
            // eslint-disable-next-line no-new-func
            timers[('clear' + name)] = (new Function(`return function (id) { return clear${name}(id); }`))();
        }

        return timers;
    }, {}),

    Timerz; // main exports constructor

/**
 * @constructor
 *
 * @param {Object} [delegations]
 * @param {Function} [onError]
 * @param {Function} [onAnyTimerStart]
 * @param {Function} [onAllTimerEnd]
 */
Timerz = function Timerz (delegations, onError, onAnyTimerStart, onAllTimerEnd) {
    var /**
         * Holds the present timers, either delegated or defaults
         * @extends Timers
         */
        timers = delegations || defaultTimers,
        dummyContext = {},

        total = 0, // accumulator to keep track of total timers
        pending = 0, // counters to keep track of running timers
        sealed = false, // flag that stops all new timer additions
        wentAsync = false,
        computeTimerEvents;

    // do special handling to enable emulation of immediate timers in hosts that lacks them
    if (typeof timers.setImmediate !== FUNCTION) {
        timers.setImmediate = function (callback) {
            return timers.setTimeout(callback, 0);
        };
        timers.clearImmediate = function (id) {
            return timers.clearTimeout(id);
        };
    }

    // write special handlers for event based timers if the delegations don't contain one
    (typeof timers.setEvent !== FUNCTION) && (function () {
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
            (typeof cb === FUNCTION) && cb.apply(dummyContext, arrayProtoSlice.call(arguments, 1));
        };

        timers.clearAllEvents = function () {
            Object.keys(events).forEach(function (prop) {
                delete events[prop];
            });
        };
    }());

    // create a function that decides whether to fire appropriate callbacks
    computeTimerEvents = function (increment, clearing) {
        increment && (pending += increment);

        if (pending === 0 && computeTimerEvents.started) {
            !clearing && (typeof onAllTimerEnd === FUNCTION) && onAllTimerEnd();
            computeTimerEvents.started = false;
            return;
        }

        if (pending > 0 && !computeTimerEvents.started) {
            !clearing && (typeof onAnyTimerStart === FUNCTION) && onAnyTimerStart();
            computeTimerEvents.started = true;
        }
    };

    // iterate through the timer variants and create common setter and clearer function behaviours for each of them.
    timerFunctionNames.forEach(function (name) {
        // create an accumulator for all timer references
        var running = {};

        // create the setter function for the timer
        this[('set' + name)] = function (callback) {
            // it is pointless to proceed with setter if there is no callback to execute
            if (sealed || typeof callback !== FUNCTION) {
                return;
            }

            var id = ++total, // get hold of the next timer id
                args = arrayProtoSlice.call(arguments);

            args[0] = function () {
                wentAsync = true; // mark that we did go async once. this will ensure we do not pass erroneous events

                // call the actual callback with a dummy context
                try { callback.apply(dummyContext, staticTimerFunctions[name] ? arguments : null); }
                catch (e) { onError && onError(e); }

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

            // for static timers
            staticTimerFunctions[name] && (wentAsync = true);

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
            delete running[id];

            // fire the underlying clearing function

            try { timers['clear' + name].apply(dummyContext, args); }
            catch (e) { onError(e); }

            // decrement counters and call the clearing timer function
            computeTimerEvents(-1, !wentAsync);

            args = underLyingId = null; // just a precaution
        };

        // create a sugar function to clear all running timers of this category
        // @todo: decide how to handle clearing for underlying delegated timers, if they are instances of Timerz itself.
        if (typeof timers[('clearAll' + name + 's')] === FUNCTION) {
            // if native timers have a function to clear all timers, then use it
            this[('clearAll' + name + 's')] = function () {
                timers[('clearAll' + name + 's')]();
                Object.keys(running).forEach(function () {
                    computeTimerEvents(-1, true);
                });
            };
        }
        else {
            this[('clearAll' + name + 's')] = function () {
                Object.keys(running).forEach(function (id) {
                    computeTimerEvents(-1, true);
                    // run clear functions except for static timers
                    timers['clear' + name](running[id]);
                });
            };
        }


    }.bind(this));


    /**
     * @memberof Timerz.prototype
     * @returns {Number}
     */
    this.queueLength = function () {
        return pending;
    };

    /**
     * @memberof Timerz.prototype
     */
    this.clearAll = function () {
        // call all internal timer clearAll function variants
        timerFunctionNames.forEach(function (name) {
            this[('clearAll' + name + 's')]();
        }.bind(this));
    };

    /**
     * @memberof Timerz.prototype
     */
    this.seal = function () {
        sealed = true;
    };

    this.error = function (err) {
        return onError.call(dummyContext, err);
    };

    this.terminate = function () {
        this.seal();
        this.clearAll();
        return onAllTimerEnd.apply(dummyContext, arguments);
    };
};

module.exports = Timerz;
