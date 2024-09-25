const getBufferModule = require('./buffer');
const SpecificBuffer = require('./specific-buffer');
const buffer = require('buffer/');

// Using 32-bit implementation value from Node
// https://github.com/nodejs/node/blob/main/deps/v8/include/v8-primitive.h#L126
const K_STRING_MAX_LENGTH = (1 << 28) - 16;

module.exports = getBufferModule({
    ...buffer,
    Buffer: SpecificBuffer(buffer.Buffer),
    kStringMaxLength: K_STRING_MAX_LENGTH,
    constants: {
        MAX_LENGTH: buffer.kMaxLength,
        MAX_STRING_LENGTH: K_STRING_MAX_LENGTH
    },
    File: File,
    Blob: Blob,
    atob: atob,
    btoa: btoa
});
