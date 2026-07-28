const getBufferModule = require('./buffer');
const SpecificBuffer = require('./specific-buffer');
const buffer = globalThis._nodeRequires.buffer;

module.exports = getBufferModule({
    ...buffer,
    SlowBuffer: typeof buffer.SlowBuffer === 'function' ? buffer.SlowBuffer : function () {
        return buffer.Buffer.allocUnsafeSlow(...arguments);
    },
    Buffer: SpecificBuffer(buffer.Buffer),
});
