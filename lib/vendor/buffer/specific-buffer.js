function SpecificBuffer (_Buffer) {
    const Buffer = function () {
        if (typeof arguments[0] === 'number') {
            return _Buffer.alloc(...arguments);
        }

        return _Buffer.from(...arguments);
    }

    Buffer.poolSize = _Buffer.poolSize;

    Object.defineProperty(Buffer, Symbol.hasInstance, {
        value: function (instance) {
            return instance instanceof _Buffer;
        }
    });

    Buffer.isBuffer = function () {
        return _Buffer.isBuffer(...arguments);
    };

    Buffer.alloc = function () {
        return _Buffer.alloc(...arguments);
    };

    Buffer.allocUnsafe = function () {
        return _Buffer.allocUnsafe(...arguments);
    };

    Buffer.allocUnsafeSlow = function () {
        return _Buffer.allocUnsafeSlow(...arguments);
    };

    Buffer.from = function () {
        return _Buffer.from(...arguments);
    };

    Buffer.compare = function () {
        return _Buffer.compare(...arguments);
    };

    Buffer.isEncoding = function () {
        return _Buffer.isEncoding(...arguments);
    };

    Buffer.concat = function () {
        return _Buffer.concat(...arguments);
    };

    Buffer.byteLength = function () {
        return _Buffer.byteLength(...arguments);
    };

    return Buffer;
}

module.exports = SpecificBuffer;
