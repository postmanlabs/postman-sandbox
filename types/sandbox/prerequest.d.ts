// Type definitions for postman-sandbox 3.5.7
// Project: https://github.com/postmanlabs/postman-sandbox
// Definitions by: PostmanLabs
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.4
/// <reference types="node" />
import {CookieList, Request, VariableScope} from "postman-collection";

declare global {
    var postman: PostmanLegacy;

    interface PostmanLegacy {
        /***
         * Sets the next request to be executed.
         * @param requestName Name of the next request to be executed.
         */
        setNextRequest(requestName: string): void;
    }

    class Postman {
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
         * The cookies object contains a list of cookies that are associated with the domain
         * to which the request was made.
         */
        cookies: CookieList;
        visualizer: Visualizer;

        /**
         * Allows one to send request from script asynchronously.
         */
        // TODO: figure out what the correct type is here, both Request from the built in types and from postman-collection
        // seem to be incorrect
        sendRequest(req: unknown | string, callback: (...params: any[]) => any): void;

        // TODO: import this type instead of relying on ambient module augmentation. this would require a tsconfig.json
        //  to explicitly specify global modules in the "types" property, however it doesn't seem to work since there
        //  seems to be types for postman-collection defined in both postman-collection and @types/postman-collection
        expect: Chai.ExpectStatic;
    }

    /**
     * Contains information pertaining to the script execution
     */
    interface Info {
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

    interface Visualizer {
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
    var pm: Postman;

    interface PostmanCookieJar {
        /**
         * Get the cookie value with the given name.
         */
        get(url: string, name: string, callback: (...params: any[]) => any): void;

        /**
         * Get all the cookies for the given URL.
         */
        getAll(url: string, options: any, callback: (...params: any[]) => any): void;

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

}

declare module "postman-collection" {

    interface CookieList {
        jar(): PostmanCookieJar
    }

}
