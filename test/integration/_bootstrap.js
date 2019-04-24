var _expect;

before(function () {
    global.expect && (_expect = global.expect);
    global.expect = require('chai').expect;
});

after(function () {
    _expect ? (global.expect = _expect) : (delete global.expect);
    _expect = null;
});
