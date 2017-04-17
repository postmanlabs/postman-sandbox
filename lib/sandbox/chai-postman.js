var sdk = require('postman-collection'),
    _ = require('lodash'),

    FIRST_LINE = /(.*?)\n.*/g,

    requestOrResponse = function (what) {
        return sdk.Request.isRequest(what) && 'request' || sdk.Response.isResponse(what) && 'response' || undefined;
    },

    statusClassReasons = {
        info: 1,
        success: 2,
        redirection: 3,
        clientError: 4,
        serverError: 5
    },

    statusCodeReasons = {
        ok: 200,
        accepted: 202,
        withoutContent: 204, // @todo add 1223 status code
        badRequest: 400,
        unauthorised: 401,
        forbidden: 403,
        notFound: 404,
        notAcceptable: 406,
        rateLimited: 429
    };

module.exports = function (chai) {
    var Assertion = chai.Assertion;

    Assertion.addProperty('postmanRequest', function () {
        this.assert(sdk.Request.isRequest(this._obj),
            'expecting a postman request object but got #{this}',
            'not expecting a postman request object');
    });

    Assertion.addProperty('postmanResponse', function () {
        this.assert(sdk.Response.isResponse(this._obj),
            'expecting a postman response object but got #{this}',
            'not expecting a postman response object');
    });

    Assertion.addProperty('postmanRequestOrResponse', function () {
        this.assert(sdk.Response.isResponse(this._obj) || sdk.Request.isRequest(this._obj),
            'expecting a postman request or response object but got #{this}',
            'not expecting a postman request or response object');
    });

    Assertion.addMethod('statusCodeClass', function (classCode) {
        new Assertion(this._obj).to.be.postmanResponse;
        new Assertion(this._obj).to.have.property('code');
        new Assertion(this._obj.code).to.be.a('number');

        var statusClass = Math.floor(this._obj.code / 100);
        this.assert(statusClass === classCode,
            'expected response code to be #{exp}XX but found #{act}',
            'expected response code to not be #{exp}XX',
            classCode, this._obj.code);
    });

    _.forOwn(statusClassReasons, function (classCode, reason) {
        Assertion.addProperty(reason, function () {
            new Assertion(this._obj).to.be.postmanResponse;
            new Assertion(this._obj).to.have.property('code');
            new Assertion(this._obj.code).to.be.a('number');

            var statusClass = Math.floor(this._obj.code / 100);
            this.assert(statusClass === classCode,
                'expected response code to be #{exp}XX but found #{act}',
                'expected response code to not be #{exp}XX',
                classCode, this._obj.code);
        });
    });

    Assertion.addProperty('error', function () {
        new Assertion(this._obj).to.be.postmanResponse;
        new Assertion(this._obj).to.have.property('code');
        new Assertion(this._obj.code).to.be.a('number');

        var statusClass = Math.floor(this._obj.code / 100);
        this.assert(statusClass === 4 || statusClass === 5,
            'expected response code to be 4XX or 5XX but found #{act}',
            'expected response code to not be 4XX or 5XX',
            null, this._obj.code);
    });

    Assertion.addMethod('statusCode', function (code) {
        new Assertion(this._obj).to.be.postmanResponse;
        new Assertion(this._obj).to.have.property('code');
        new Assertion(this._obj.code).to.be.a('number');

        this.assert(this._obj.code === Number(code),
            'expected response to have status code #{exp} but got #{act}',
            'expected response to not have status code #{act}',
            Number(code), this._obj.code);
    });

    Assertion.addMethod('statusReason', function (reason) {
        new Assertion(this._obj).to.be.postmanResponse;
        new Assertion(this._obj).to.have.property('reason');
        new Assertion(this._obj.reason).to.be.a('function');

        reason = String(reason);

        this.assert(this._obj.reason() === reason,
            'expected response to have status reason #{exp} but got #{act}',
            'expected response to not have status reason #{act}',
            reason, this._obj.reason());
    });

    _.forOwn(statusCodeReasons, function (statusCode, reason) {
        Assertion.addProperty(reason, function () {
            new Assertion(this._obj).to.be.postmanResponse;
            new Assertion(this._obj).to.have.property('reason');
            new Assertion(this._obj.reason).to.be.a('function');

            var wantedReason = String(reason).toUpperCase(),
                actualReason = String(this._obj.reason()).toUpperCase();

            this.assert(actualReason === wantedReason,
                'expected response to have status reason #{exp} but got #{act}',
                'expected response to not have status reason #{act}',
                wantedReason, actualReason);
        });
    });

    Assertion.addMethod('status', function (codeOrReason) {
        new Assertion(this._obj).to.be.postmanResponse;

        if (_.isNumber(codeOrReason)) {
            new Assertion(this._obj).to.have.property('code');
            new Assertion(this._obj.code).to.be.a('number');

            this.assert(this._obj.code === Number(codeOrReason),
                'expected response to have status code #{exp} but got #{act}',
                'expected response to not have status code #{act}',
                Number(codeOrReason), this._obj.code);
        }
        else {
            new Assertion(this._obj).to.have.property('reason');
            new Assertion(this._obj.reason).to.be.a('function');

            this.assert(this._obj.reason() === codeOrReason,
                'expected response to have status reason #{exp} but got #{act}',
                'expected response to not have status reason #{act}',
                codeOrReason, this._obj.reason());
        }
    });

    Assertion.addMethod('header', function (headerKey, headerValue) {
        new Assertion(this._obj).to.be.postmanRequestOrResponse;
        new Assertion(this._obj).to.have.property('headers');

        var ror = requestOrResponse(this._obj);

        this.assert(this._obj.headers.has(headerKey),
            'expected ' + ror + ' to have header with key #{exp}',
            'expected ' + ror + ' to not have header with key #{exp}',
            headerKey);

        if (arguments.length < 2) { return; } // in case no check is done on value

        this.assert(this._obj.headers.one(headerKey).value === headerValue,
            'expected \'' + String(headerKey) + '\' ' + ror + ' header to be #{exp} but got #{act}',
            'expected \'' + String(headerKey) + '\' ' + ror + ' header to not be #{act}',
            headerValue, this._obj.headers.one(headerKey).value);
    });

    Assertion.addProperty('withBody', function () {
        new Assertion(this._obj).to.be.postmanResponse;
        new Assertion(this._obj).to.have.property('text');
        new Assertion(this._obj.json).to.be.a('function');

        var bodyText = this._obj.text();

        this.assert(_.isString(bodyText) && bodyText.length,
            'expected response to have content in body',
            'expected response to not have content in body');
    });

    Assertion.addProperty('json', function () {
        new Assertion(this._obj).to.be.postmanResponse;
        new Assertion(this._obj).to.have.property('json');
        new Assertion(this._obj.json).to.be.a('function');

        var parseError;

        try { this._obj.json(); }
        catch (e) {
            if (e.name === 'JSONError' && e.message) {
                parseError = e.message.replace(FIRST_LINE, '$1');
            }
            else {
                parseError = e.name + ': ' + e.message;
            }
        }

        this.assert(!parseError,
            'expected response body to be a valid json but got error ' + parseError,
            'expected response body not to be a valid json');

    });

    // @todo add tests for:
    // 1. request and response content type
    // 2. response encoding
    // 3. response time
    // 4. response size
    // 5. cookies
    // 6. assert on http/https
    // 7. assert property "secured" and include auth flags
};
