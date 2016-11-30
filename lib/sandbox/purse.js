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
