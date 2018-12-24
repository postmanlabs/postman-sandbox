module.exports = {
    bundler: {
        noParse: ['jquery']
    },
    require: {
        // builtins required by the libraries exposed for sandbox users
        events: {preferBuiltin: true, glob: true},
        path: {preferBuiltin: true, glob: true},
        timers: {preferBuiltin: true},
        _process: {preferBuiltin: true, glob: true},
        util: {preferBuiltin: true, glob: true},
        stream: {preferBuiltin: true, glob: true},
        string_decoder: {preferBuiltin: true, glob: true},
        buffer: {expose: 'buffer', glob: true},
        url: {preferBuiltin: true, glob: true},
        punycode: {preferBuiltin: true, glob: true},
        querystring: {preferBuiltin: true, glob: true},
        fs: {preferBuiltin: true},
        os: {preferBuiltin: true},
        'liquid-json': {expose: 'json', glob: true},
        'crypto-js': {glob: true},
        atob: {glob: true},
        btoa: {glob: true},
        ajv: {glob: true},
        tv4: {glob: true},
        xml2js: {glob: true},
        backbone: {glob: true},
        cheerio: {glob: true},
        assert: {glob: true},
        // expose has been set like this to make it easier to accommodate the async API later
        'csv-parse': {resolve: 'csv-parse/lib/sync', expose: 'csv-parse/lib/sync', glob: true},
        'postman-collection': {expose: 'postman-collection', glob: true},
        uuid: {resolve: '../vendor/uuid', expose: 'uuid', glob: true},
        chai: {glob: true},
        moment: {resolve: 'moment/min/moment.min', expose: 'moment', glob: true},
        lodash: {glob: true}
    },
    ignore: ['aws4', 'hawk', 'node-oauth1'],
    files: {
        '../vendor/sugar': true, // sugar is tricky as module. hence included as vendor.
        '../sandbox': true
    }
};
