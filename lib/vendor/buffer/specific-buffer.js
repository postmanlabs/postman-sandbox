const NOT_IMPLEMENTED = function () {
    throw new Error('Not implemented');
};

function SpecificBuffer (_Buffer) {
    function Buffer () {
        if (typeof arguments[0] === 'number') {
            return _Buffer.alloc(...arguments);
        }

        return _Buffer.from(...arguments);
    }

    // Add the static properties from the original Buffer
    Object.setPrototypeOf(Buffer, _Buffer);

    Buffer.poolSize = _Buffer.poolSize;

    Object.defineProperty(Buffer, Symbol.hasInstance, {
        value: function (instance) {
            return instance instanceof _Buffer;
        }
    });

    Buffer.from = function from () {
        return _Buffer.from(...arguments);
    };

    Buffer.copyBytesFrom = NOT_IMPLEMENTED;

    Buffer.of = NOT_IMPLEMENTED;

    Buffer.alloc = function alloc () {
        return _Buffer.alloc(...arguments);
    };

    Buffer.allocUnsafe = function allocUnsafe () {
        return _Buffer.allocUnsafe(...arguments);
    };

    Buffer.allocUnsafeSlow = function allocUnsafeSlow () {
        return _Buffer.allocUnsafeSlow(...arguments);
    };

    Buffer.isBuffer = function isBuffer () {
        return _Buffer.isBuffer(...arguments);
    };

    Buffer.compare = function compare () {
        return _Buffer.compare(...arguments);
    };

    Buffer.isEncoding = function isEncoding () {
        return _Buffer.isEncoding(...arguments);
    };

    Buffer.concat = function concat () {
        return _Buffer.concat(...arguments);
    };

    Buffer.byteLength = function byteLength () {
        return _Buffer.byteLength(...arguments);
    };

    return Buffer;
}

module.exports = SpecificBuffer;
