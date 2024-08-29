const SpecificBuffer = require('./buffer');
const buffer = globalThis._nodeRequires.buffer;

module.exports = {
    Buffer: SpecificBuffer(globalThis.Buffer),
    SlowBuffer: buffer.SlowBuffer,
    INSPECT_MAX_BYTES: buffer.INSPECT_MAX_BYTES,
    kMaxLength: buffer.kMaxLength
}
