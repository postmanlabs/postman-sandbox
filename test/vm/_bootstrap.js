var Mocha = require('mocha').Mocha,

    mocha;

// @hack to avoid path.resolve errors
Mocha.prototype.loadFiles = function (fn) {
    var self = this,
        suite = this.suite;

    this.files.forEach(function (file) {
        suite.emit('pre-require', global, file, self);
        suite.emit('require', require(file), file, self);
        suite.emit('post-require', global, file, self);
    });
    fn && fn();
};

mocha = new Mocha({timeout: 1000 * 60, useColors: true});

__specs.forEach(mocha.addFile.bind(mocha)); // @hack __specs is exposed in the VM context

mocha.run(__next); // @hack exposed in the VM context
