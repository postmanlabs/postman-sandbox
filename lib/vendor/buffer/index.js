const getBufferModule = require('./buffer');
const SpecificBuffer = require('./specific-buffer');
const buffer = globalThis._nodeRequires.buffer;

module.exports = getBufferModule({
    ...buffer,
    Buffer: SpecificBuffer(globalThis.Buffer),
});
