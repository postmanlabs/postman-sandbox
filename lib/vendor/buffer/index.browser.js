const SpecificBuffer = require('./buffer');
const buffer = require('buffer/');

module.exports = {
    Buffer: SpecificBuffer(buffer.Buffer),
    SlowBuffer: buffer.SlowBuffer,
    INSPECT_MAX_BYTES: buffer.INSPECT_MAX_BYTES,
    kMaxLength: buffer.kMaxLength
}
