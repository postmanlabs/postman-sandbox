// Type definitions for postman-sandbox 3.5.7
// Project: https://github.com/postmanlabs/postman-sandbox
// Definitions by: PostmanLabs
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4
/// <reference types="node" />
declare var postman: PostmanLegacy;

declare interface PostmanLegacy {
    /***
     * Sets the next request to be executed.
     * @param requestName Name of the next request to be executed.
     */
    setNextRequest(requestName: string): void;
}

declare class Postman {
    constructor(bridge: EventEmitter, execution: Execution, onRequest: (...params: any[]) => any, cookieStore: any);
    /**
     * The pm.info object contains information pertaining to the script being executed.
     * Useful information such as the request name, request Id, and iteration count are
     * stored inside of this object.
     */
    info: Info;
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
     * Inside the test scripts, the pm.response object contains all information pertaining
     * to the response that was received.
     */
    response: import("postman-collection").Response;
    /**
     * The cookies object contains a list of cookies that are associated with the domain
     * to which the request was made.
     */
    cookies: import("postman-collection").CookieList;
    visualizer: Visualizer;
    /**
     * Allows one to send request from script asynchronously.
     */
    sendRequest(req: import("postman-collection").Request | string, callback: (...params: any[]) => any): void;
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
 * The pm object encloses all information pertaining to the script being executed and
 * allows one to access a copy of the request being sent or the response received.
 * It also allows one to get and set environment and global variables.
 */
declare var pm: Postman;

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

interface Response extends Assertable {

}

interface Assertable {
    to: {
        have: AssertableHave

        /**
         * The properties inside the "pm.response.to.be" object allows you to easily assert a set of pre-defined rules.
         */
        be: AssertableBe
    }
}

interface AssertableHave {
    status(code: number): any
    status(reason: string): any
    header(key: string): any
    header(key: string, optionalValue: string): any
    body(): any
    body(optionalStringValue: string): any
    body(optionalRegExpValue: RegExp): any
    jsonBody(): any
    jsonBody(optionalExpectEqual: object): any
    jsonBody(optionalExpectPath: string): any
    jsonBody(optionalExpectPath: string, optionalValue: any): any
    jsonSchema(schema: object): any
    jsonSchema(schema: object, ajvOptions: object): any
}

interface AssertableBe {

    /**
     * Checks 1XX status code
     */
    info: number

    /**
     * Checks 2XX status code
     */
    success: number

    /**
     * Checks 3XX status code
     */
    redirection: number

    /**
     * Checks 4XX status code
     */
    clientError: number

    /**
     * Checks 5XX
     */
    serverError: number

    /**
     * Checks 4XX or 5XX
     */
    error: number

    /**
     * Status code must be 200
     */
    ok: number

    /**
     * Status code must be 202
     */
    accepted: number

    /**
     * Status code must be 400
     */
    badRequest: number

    /**
     * Status code must be 401
     */
    unauthorized: number

    /**
     * Status code 403
     */
    forbidden: number

    /**
     * Status code of response is checked to be 404
     */
    notFound: number

    /**
     * Checks whether response status code is 429
     */
    rateLimited: number
}

}
