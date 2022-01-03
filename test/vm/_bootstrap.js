// Assigned 'global' to fix mocha v9.1.2 bump
// Ref: https://github.com/mochajs/mocha/pull/4746
var Mocha = Object.assign(require('mocha'), global).Mocha,

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

mocha = new Mocha({ timeout: 1000 * 60, useColors: true });

// eslint-disable-next-line no-undef
__specs.forEach(mocha.addFile.bind(mocha)); // @hack __specs is exposed in the VM context

// eslint-disable-next-line no-undef
mocha.run(__next); // @hack exposed in the VM context
