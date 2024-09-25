const getBufferModule = require('./buffer');
const SpecificBuffer = require('./specific-buffer');
const buffer = require('buffer/');

module.exports = getBufferModule({
    ...buffer,
    Buffer: SpecificBuffer(buffer.Buffer)
})
