function getBufferModule (buffer) {
    return  {
        Buffer: buffer.Buffer,
        SlowBuffer: buffer.SlowBuffer,
        INSPECT_MAX_BYTES: buffer.INSPECT_MAX_BYTES,
        kMaxLength: buffer.kMaxLength
    }
}

module.exports = getBufferModule;
