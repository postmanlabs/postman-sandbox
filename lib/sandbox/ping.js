module.exports = {
    listener (pong) {
        return function (payload) {
            this.dispatch(pong, payload);
        };
    }
};

