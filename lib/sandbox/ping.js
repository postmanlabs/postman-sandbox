module.exports = {
    listener (pong) {
        return function (payload) {
            this.dispatch(null, pong, payload);
        };
    }
};

