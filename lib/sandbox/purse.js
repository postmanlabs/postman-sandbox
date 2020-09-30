/**
 * This module adds `.toJSON` to prototypes of objects that does not behave well with JSON.stringify() This aides in
 * accurate transport of information between IPC
 *
 */
try {
    Error && (Error.prototype.toJSON = function () { // eslint-disable-line no-extend-native
        return {
            type: 'Error',
            name: this.name,
            message: this.message
        };
    });
}
catch (e) {} // eslint-disable-line no-empty

const { Request, Response } = require('postman-collection');

/**
 * We override toJSON to not export additional helpers that sandbox adds to pm.request and pm.response.
 */
try {
    Request.prototype.toJSON = (function (superToJSON) { // eslint-disable-line no-extend-native
        return function () {
            var tmp = this.to,
                json;

            // remove properties added by sandbox before doing a toJSON
            delete this.to;
            json = superToJSON.apply(this, arguments);

            this.to = tmp;

            return json;
        };
    }(Request.prototype.toJSON));

    Response.prototype.toJSON = (function (superToJSON) { // eslint-disable-line no-extend-native
        return function () {
            var tmp = this.to,
                json;

            // remove properties added by sandbox before doing a toJSON
            delete this.to;
            json = superToJSON.apply(this, arguments);

            this.to = tmp;

            return json;
        };
    }(Response.prototype.toJSON));
}
catch (e) {} // eslint-disable-line no-empty
