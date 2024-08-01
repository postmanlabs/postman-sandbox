// Type definitions for postman-sandbox 5.0.0
// Project: https://github.com/postmanlabs/postman-sandbox
// Definitions by: PostmanLabs
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4
/// <reference types="node" />

declare const CONSOLE_EVENT = "execution.console";

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

/**
 * @param cookieStore - Cookie store instance
 */
declare class PostmanCookieJar {
    constructor(cookieStore: any);
    /**
     * Get the cookie value with the given name.
     * @param url - URL string
     * @param name - Cookie name
     * @param [callback] - Callback function
     * @returns - Returns a promise if callback is not provided
     */
    get(url: string, name: string, callback?: (...params: any[]) => any): Promise | undefined;
    /**
     * Get all the cookies for the given URL.
     * @param url - URL string
     * @param [options] - Options object
     * @param [options.http] - Include only HttpOnly cookies
     * @param [options.secure] - Include Secure cookies
     * @param [callback] - Callback function
     * @returns - Returns a promise if callback is not provided
     */
    getAll(url: string, options?: {
        http?: boolean;
        secure?: boolean;
    }, callback?: (...params: any[]) => any): Promise | undefined;
    /**
     * Set or update a cookie.
     * @param url - URL string
     * @param name - Cookie name
     * @param [value] - Cookie value
     * @param [callback] - Callback function
     * @returns - Returns a promise if callback is not provided
     */
    set(url: string, name: string | any, value?: string | ((...params: any[]) => any), callback?: (...params: any[]) => any): Promise | undefined;
    /**
     * Remove single cookie with the given name.
     * @param url - URL string
     * @param name - Cookie name
     * @param [callback] - Callback function
     * @returns - Returns a promise if callback is not provided
     */
    unset(url: string, name: string, callback?: (...params: any[]) => any): Promise | undefined;
    /**
     * Remove all the cookies for the given URL.
     * @param url - URL string
     * @param [callback] - Callback function
     * @returns - Returns a promise if callback is not provided
     */
    clear(url: string, callback?: (...params: any[]) => any): Promise | undefined;
}

/**
 * The pm object encloses all information pertaining to the script being executed and
 * allows one to access a copy of the request being sent or the response received.
 * It also allows one to get and set environment and global variables.
 */
declare var pm: Postman;

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

/**
 * Cache of all files that are available to be required.
 */
declare type FileCache = {
    [key: string]: { data: string; } | { error: string; };
};

/**
 * @param fileCache - fileCache
 */
declare class PostmanRequireStore {
    constructor(fileCache: FileCache);
    /**
     * Check if the file is available in the cache.
     * @param path - path
     */
    hasFile(path: string): boolean;
    /**
     * Get the file from the cache.
     * @param path - path
     * @returns - file
     */
    getFile(path: string): any | undefined;
    /**
     * Get the resolved path for the file.
     * @param path - path
     * @returns - resolved path
     */
    getResolvedPath(path: string): string | undefined;
    /**
     * Get the file data.
     * @param path - path
     */
    getFileData(path: string): string | undefined;
    /**
     * Check if the file has an error.
     * @param path - path
     */
    hasError(path: string): boolean;
    /**
     * Get the file error.
     * @param path - path
     */
    getFileError(path: string): string | undefined;
}

/**
 * @example
 * const fileCache = {
 *      'path/to/file.js': {
 *          data: 'module.exports = { foo: "bar" };'
 *      }
 *  };
 *
 *  const postmanRequire = createPostmanRequire(fileCache, scope);
 *
 *  const module = postmanRequire('path/to/file.js');
 *  console.log(module.foo); // bar
 * @param fileCache - fileCache
 * @param scope - scope
 * @returns - postmanRequire
 */
declare function createPostmanRequire(fileCache: FileCache, scope: any): (...params: any[]) => any;

/**
 * @param execution - execution context
 * @param onRequest - callback to execute when pm.sendRequest() called
 * @param onSkipRequest - callback to execute when pm.execution.skipRequest() called
 * @param onAssertion - callback to execute when pm.expect() called
 * @param cookieStore - cookie store
 * @param requireFn - requireFn
 * @param [options] - options
 * @param [options.disabledAPIs] - list of disabled APIs
 */
declare class Postman {
    constructor(execution: Execution, onRequest: (...params: any[]) => any, onSkipRequest: (...params: any[]) => any, onAssertion: (...params: any[]) => any, cookieStore: any, requireFn: (...params: any[]) => any, options?: {
        disabledAPIs?: string[];
    });
    /**
     * The pm.info object contains information pertaining to the script being executed.
     * Useful information such as the request name, request Id, and iteration count are
     * stored inside of this object.
     */
    info: Info;
    vault: VariableScope;
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
     * @param req - request object or request url
     * @param [callback] - callback function
     * @returns - returns a promise if callback is not provided
     */
    sendRequest(req: Request | string, callback?: (...params: any[]) => any): Promise | undefined;
    /**
     * Exposes handlers to control or access execution state
     */
    execution: Execution;
    /**
     * Imports a package in the script.
     * @param name - name of the module
     * @returns - exports from the module
     */
    require(name: string): any;
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

declare interface Execution {
    request: any;
    response: any;
    /**
     * Stops the current request and its scripts from executing.
     */
    skipRequest(): void;
    /**
     * The path of the current request.
     */
    location: ExecutionLocation;
    /**
     * Sets the next request to be run after the current request, when
     * running the collection. Passing `null` stops the collection run
     * after the current request is executed.
     * @param request - name of the request to run next
     */
    setNextRequest(request: string | null): void;
}

declare interface ExecutionLocation extends Array {
    /**
     * The item name whose script is currently being executed.
     */
    current: string;
}

/**
 * Different modes for a request body.
 */
declare const enum REQUEST_MODES {
    RAW = "raw",
    URLENCODED = "urlencoded",
    FORMDATA = "formdata",
    FILE = "file"
}

/**
 * Raises a single assertion event with an array of assertions from legacy `tests` object.
 * @param scope - -
 * @param pmapi - -
 * @param onAssertion - -
 */
declare function raiseAssertionEvent(scope: Uniscope, pmapi: any, onAssertion: (...params: any[]) => any): void;

/**
 * @param execution - -
 * @param globalvars - -
 */
declare class PostmanLegacyInterface {
    constructor(execution: any, globalvars: any);
}

declare class PostmanLegacyTestInterface extends PostmanLegacyInterface {
    /**
     * @param cookieName - -
     */
    getResponseCookie(cookieName: string): any;
    /**
     * @param headerName - -
     */
    getResponseHeader(headerName: string): string;
}

declare var SandboxGlobals: any;

/**
 * The set of timer function names. We use this array to define common behavior of all setters and clearer timer
 * functions
 */
declare const timerFunctionNames: string[];

/**
 * This object defines a set of timer function names that are triggered a number of times instead of a single time.
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
declare const defaultTimers: any;

/**
 * @param [delegations] - -
 * @param [onError] - -
 * @param [onAnyTimerStart] - -
 * @param [onAllTimerEnd] - -
 */
declare class Timerz {
    constructor(delegations?: any, onError?: (...params: any[]) => any, onAnyTimerStart?: (...params: any[]) => any, onAllTimerEnd?: (...params: any[]) => any);
    /**
     * Holds the present timers, either delegated or defaults
     */
    timers: any;
}

declare const xml2jsOptions: any;

