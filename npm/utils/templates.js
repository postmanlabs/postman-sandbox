var pkg = require('../../package.json'),

    heading =
`// Type definitions for postman-sandbox ${pkg.version}
// Project: https://github.com/postmanlabs/postman-sandbox
// Definitions by: PostmanLabs
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4
/// <reference types="node" />
`,

    postmanLegacyString =
`declare var postman: PostmanLegacy;

declare interface PostmanLegacy {

    /***
     * Sets the next request to be executed.
     * @param requestName Name of the next request to be executed.
     */
    setNextRequest(requestName: string): void
}`,

    postmanExtensionString =
`interface Postman {
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
}`,

    cookieListExtensionString =
`interface CookieList {
    jar() : PostmanCookieJar
}`,

    responseExtensionString =
`interface Response extends Assertable {

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
}`;

module.exports = {
    heading: heading,
    postmanLegacyString: postmanLegacyString,
    postmanExtensionString: postmanExtensionString,
    cookieListExtensionString: cookieListExtensionString,
    responseExtensionString: responseExtensionString
};


