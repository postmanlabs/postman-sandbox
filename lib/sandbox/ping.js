module.exports = {
    listener: function (pong) {
        return function (payload) {
            this.dispatch(pong, payload);
        };
    }
};

