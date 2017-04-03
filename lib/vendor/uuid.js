var plc = 'x',
    pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
    bit = /[xy]/g,
    replacer = function(c) {
        var r = Math.random()*16|0, v = c == plc ? r : (r&0x3|0x8);
        return v.toString(16);
    };

module.exports = function () {
    return pattern.replace(bit, replacer);
};

module.exports.v4 = function () {
    return pattern.replace(bit, replacer);
};
