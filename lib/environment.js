module.exports = {
    bundler: {
        noParse: ['jquery']
    },
    require: {
        // builtins required by the libraries exposed for sandbox users
        events: {preferBuiltin: true, glob: true},
        timers: {preferBuiltin: true, glob: true},
        _process: {preferBuiltin: true, glob: true},
        util: {preferBuiltin: true, glob: true},
        buffer: {expose: 'buffer', glob: true},
        'liquid-json': {expose: 'json', glob: true},
        lodash3: {expose: 'lodash', glob: true},
        'crypto-js': {glob: true},
        atob: {glob: true},
        btoa: {glob: true},
        tv4: {glob: true},
        xml2js: {glob: true},
        backbone: {glob: true},
        cheerio: {glob: true},
        'assert': {glob: true}
    },
    files: {
        '../vendor/sugar': true, // sugar is tricky as module. hence included as vendor.
        '../sandbox': true
    }
};
