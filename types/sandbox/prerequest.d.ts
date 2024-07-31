// Type definitions for postman-sandbox 5.0.0
// Project: https://github.com/postmanlabs/postman-sandbox
// Definitions by: PostmanLabs
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4
/// <reference types="node" />
/**
 * @deprecated
 */
declare var postman: PostmanLegacy;

declare interface PostmanLegacy {
    /***
     * Sets the next request to be executed.
     * @param requestName Name of the next request to be executed.
     *
     * @deprecated Use pm.execution.setNextRequest() instead
     */
    setNextRequest(requestName: string): void;
}

/**
 * @deprecated Use pm.test() instead
 */
declare var tests;

/**
 * @deprecated Use pm.globals instead
 */
declare var globals;

/**
 * @deprecated Use pm.environment instead
 */
declare var environment;

/**
 * @deprecated Use pm.iterationData instead
 */
declare var data;

/**
 * @deprecated Use pm.request instead
 */
declare var request;

/**
 * @deprecated Use pm.info.iteration instead
 */
declare var iteration;

/**
 * @deprecated Use require('lodash') instead
 */
declare var _;

/**
 * @deprecated Use require('crypto-js') instead
 */
declare var CryptoJS;

/**
 * @deprecated Use require('atob') instead
 */
declare var atob;

/**
 * @deprecated Use require('btoa') instead
 */
declare var btoa;

/**
 * @deprecated Use require('ajv') instead
 */
declare var tv4;

/**
 * @deprecated Use require('xml2js') instead
 */
declare var xml2Json;

/**
 * @deprecated Use require('backbone') instead
 */
declare var Backbone;

/**
 * @deprecated Use require('cheerio') instead
 */
declare var cheerio;

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
    vault: import("postman-collection").VariableScope;
    globals: import("postman-collection").VariableScope;
    environment: import("postman-collection").VariableScope;
    collectionVariables: import("postman-collection").VariableScope;
    variables: import("postman-collection").VariableScope;
    /**
     * The iterationData object contains data from the data file provided during a collection run.
     */
    iterationData: import("postman-collection").VariableScope;
    /**
     * The request object inside pm is a representation of the request for which this script is being run.
     * For a pre-request script, this is the request that is about to be sent and when in a test script,
     * this is the representation of the request that was sent.
     */
    request: import("postman-collection").Request;
    /**
     * The cookies object contains a list of cookies that are associated with the domain
     * to which the request was made.
     */
    cookies: import("postman-collection").CookieList;
    visualizer: Visualizer;
    /**
     * Allows one to send request from script asynchronously.
     * @param req - request object or request url
     * @param [callback] - callback function
     * @returns - returns a promise if callback is not provided
     */
    sendRequest(req: import("postman-collection").Request | string, callback?: (...params: any[]) => any): Promise | undefined;
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
    /**
     * Stops the current request and its scripts from executing.
     * @excludeFromTestScript
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
 * The pm object encloses all information pertaining to the script being executed and
 * allows one to access a copy of the request being sent or the response received.
 * It also allows one to get and set environment and global variables.
 */
declare var pm: Postman;

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



interface Postman {
    test: Test;
}

interface Test {

    /**
     * You can use this function to write test specifications inside either the Pre-request Script or Tests sandbox.
     * Writing tests inside this function allows you to name the test accurately and this function also ensures the
     * rest of the script is not blocked even if there are errors inside the function.
     * @param testName
     * @param specFunction
     */
    (testName: string, specFunction: Function): void

    /**
     * Get the total number tests from a specific location.
     */
    index(): number,

    /**
     * By appending .skip(), you may tell test runner to ignore test case.
     * @param testName
     */
    skip(testName: string): void
}

declare module "postman-collection" {

interface CookieList {
    jar() : PostmanCookieJar
}

}
