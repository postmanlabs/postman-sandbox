const NOT_IMPLEMENTED = function () {
    throw new Error('Not implemented');
};

function getBufferModule (buffer) {
    return  {
        Buffer: buffer.Buffer,
        SlowBuffer: buffer.SlowBuffer,
        INSPECT_MAX_BYTES: buffer.INSPECT_MAX_BYTES,
        kMaxLength: buffer.kMaxLength,
        kStringMaxLength: buffer.kStringMaxLength,
        constants: buffer.constants,
        File: buffer.File,
        Blob: buffer.Blob,
        isAscii: NOT_IMPLEMENTED,
        isUtf8: NOT_IMPLEMENTED,
        resolveObjectURL: NOT_IMPLEMENTED,
        transcode: NOT_IMPLEMENTED
    }
}

module.exports = getBufferModule;
