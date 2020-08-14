// Type definitions for postman-sandbox 3.5.7
// Project: https://github.com/postmanlabs/postman-sandbox
// Definitions by: PostmanLabs
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4
/// <reference types="node" />

declare const CONSOLE_EVENT_BASE = "execution.console.";

/**
 * List of functions that we expect and create for console
 */
declare const logLevels: string[];

/**
 * Replacer to be used with teleport-javascript to handle cases which are not
 * handled by it.
 * @param key - Key of the property to replace
 * @param value - Value of property to replace
 * @returns Replaced value
 */
declare function replacer(key: string, value: any): any;

declare interface PostmanCookieJar {
    /**
     * Get the cookie value with the given name.
     */
    get(url: string, name: string, callback: (...params: any[]) => any): void;
    /**
     * Get all the cookies for the given URL.
     */
    getAll(url: string, options?: any, callback: (...params: any[]) => any): void;
    /**
     * Set or update a cookie.
     */
    set(url: string, name: string | any, value?: string | ((...params: any[]) => any), callback?: (...params: any[]) => any): void;
    /**
     * Remove single cookie with the given name.
     */
    unset(url: string, name: string, callback?: (...params: any[]) => any): void;
    /**
     * Remove all the cookies for the given URL.
     */
    clear(url: string, callback?: (...params: any[]) => any): void;
}

/**
 * The pm object encloses all information pertaining to the script being executed and
 * allows one to access a copy of the request being sent or the response received.
 * It also allows one to get and set environment and global variables.
 */
declare var pm: Postman;

declare var request: any;

declare var response: any;

/**
 * @property async - true if the executed script was async, false otherwise
 * @property visualizer - visualizer data
 * @property nextRequest - next request to send
 */
declare type Return = {
    async: boolean;
    visualizer: Visualizer;
    nextRequest: any;
};

declare class Postman {
    constructor(bridge: EventEmitter, execution: Execution, onRequest: (...params: any[]) => any, cookieStore: any);
    /**
     * The pm.info object contains information pertaining to the script being executed.
     * Useful information such as the request name, request Id, and iteration count are
     * stored inside of this object.
     */
    info: Info;
    globals: VariableScope;
    environment: VariableScope;
    collectionVariables: VariableScope;
    variables: VariableScope;
    /**
     * The iterationData object contains data from the data file provided during a collection run.
     */
    iterationData: VariableScope;
    /**
     * The request object inside pm is a representation of the request for which this script is being run.
     * For a pre-request script, this is the request that is about to be sent and when in a test script,
     * this is the representation of the request that was sent.
     */
    request: Request;
    /**
     * Inside the test scripts, the pm.response object contains all information pertaining
     * to the response that was received.
     */
    response: Response;
    /**
     * The cookies object contains a list of cookies that are associated with the domain
     * to which the request was made.
     */
    cookies: CookieList;
    visualizer: Visualizer;
    /**
     * Allows one to send request from script asynchronously.
     */
    sendRequest(req: Request | string, callback: (...params: any[]) => any): void;
    expect: Chai.ExpectStatic;
}

/**
 * Contains information pertaining to the script execution
 */
declare interface Info {
    /**
     * Contains information whether the script being executed is a "prerequest" or a "test" script.
     */
    eventName: string;
    /**
     * Is the value of the current iteration being run.
     */
    iteration: number;
    /**
     * Is the total number of iterations that are scheduled to run.
     */
    iterationCount: number;
    /**
     * The saved name of the individual request being run.
     */
    requestName: string;
    /**
     * The unique guid that identifies the request being run.
     */
    requestId: string;
}

declare interface Visualizer {
    /**
     * Set visualizer template and its options
     * @param template - visualisation layout in form of template
     * @param [data] - data object to be used in template
     * @param [options] - options to use while processing the template
     */
    set(template: string, data?: any, options?: any): void;
    /**
     * Clear all visualizer data
     */
    clear(): void;
}

/**
 * Different modes for a request body.
 */
declare enum REQUEST_MODES {
    RAW = "raw",
    URLENCODED = "urlencoded",
    FORMDATA = "formdata",
    FILE = "file"
}

/**
 * Raises a single assertion event with an array of assertions from legacy `tests` object.
 */
declare function raiseAssertionEvent(scope: Uniscope, execution: Execution, pmapi: any): void;

declare class PostmanLegacyInterface {
    constructor(options: any);
}

declare class PostmanLegacyTestInterface extends PostmanLegacyInterface {
    constructor(options: any);
}

declare function getResponseCookie(cookieName: string): any;

declare function getResponseHeader(headerName: string): string;

declare var SandboxGlobals: any;

/**
 * The set of timer function names. We use this array to define common behaviour of all setters and clearer timer
 * functions
 */
declare const timerFunctionNames: string[];

/**
 * This object defines a set of timer function names that are trigerred a number of times instead of a single time.
 * Such timers, when placed in generic rules, needs special attention.
 */
declare const multiFireTimerFunctions: boolean[];

/**
 * This object defines a set of function timer names that do not fire based on any pre-set duration or interval.
 * Such timers, when placed in generic rules, needs special attention.
 */
declare const staticTimerFunctions: boolean[];

/**
 * A local copy of Slice function of Array
 */
declare const arrayProtoSlice: (...params: any[]) => any;

/**
 * This object holds the current global timers
 */
declare var defaultTimers: any;

declare class Timerz {
    constructor(delegations?: any, onError?: (...params: any[]) => any, onAnyTimerStart?: (...params: any[]) => any, onAllTimerEnd?: (...params: any[]) => any);
    /**
     * Holds the present timers, either delegated or defaults
     */
    timers: any;
}

declare const xml2jsOptions: any;

