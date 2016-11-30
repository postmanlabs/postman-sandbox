module.exports = {
    require: {
        events: {preferBuiltin: true},
        _process: {preferBuiltin: true},
        timers: {preferBuiltin: true},
        'buffer-browserify': {expose: 'buffer'},
        'liquid-json': {expose: 'json'},
        lodash3: {expose: 'lodash'},
        'crypto-js': true,
        atob: true,
        btoa: true,
        tv4: true,
        xml2js: true,
        backbone: true,
        cheerio: true
    },
    files: {
        '../vendor/sugar': true,
        '../sandbox': true
    }
};
