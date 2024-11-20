/**
 * @fileOverview
 * This is a sandbox environment configuration definition file. Basically, this holds the configuration
 * of what codebases and libraries needs to be loaded by the bundler (located in lib/bundle and is a form of
 * specialised code packer derived by using browserify) as they get initialised in bootcode.js
 */
module.exports = {
    bundler: {
        noParse: ['jquery']
    },

    /**
     * These are definitions of what libraries will be available for being "require"-ed by users
     * within the sandbox. To understand the structure of defining this, have a look at the definition
     * of the {@see Bundle} Class
     *
     * @type {Object<Bundle>}
     */
    require: {
        // builtins required by the libraries exposed for sandbox users
        events: { preferBuiltin: true, glob: true },
        path: { preferBuiltin: true, glob: true },
        timers: { preferBuiltin: true },
        _process: { preferBuiltin: true, glob: true },
        util: { preferBuiltin: true, glob: true },
        stream: { preferBuiltin: true, glob: true },
        string_decoder: { preferBuiltin: true, glob: true },
        buffer: { resolve: 'buffer/index.js', expose: 'buffer', glob: true },
        url: { preferBuiltin: true, glob: true },
        punycode: { preferBuiltin: true, glob: true },
        querystring: { preferBuiltin: true, glob: true },
        fs: { preferBuiltin: true },
        os: { preferBuiltin: true },
        'liquid-json': { expose: 'json', glob: true },
        'crypto-js': { glob: true },
        atob: { glob: true },
        btoa: { glob: true },
        ajv: { glob: true },
        tv4: { glob: true },
        xml2js: { glob: true },
        backbone: { glob: true },
        cheerio: { glob: true },
        assert: { resolve: 'assert/build/assert.js', expose: 'assert', glob: true },
        // expose has been set like this to make it easier to accommodate the async API later
        'csv-parse': { resolve: 'csv-parse/lib/sync', expose: 'csv-parse/lib/sync', glob: true },
        'postman-collection': { expose: 'postman-collection', glob: true },
        uuid: { resolve: '../vendor/uuid', expose: 'uuid', glob: true },
        chai: { glob: true },
        moment: { resolve: 'moment/min/moment.min', expose: 'moment', glob: true },
        lodash: { glob: true },

        // use reduced version of natural module
        natural: { resolve: '../vendor/natural', expose: 'natural', glob: true },
        // also expose sub modules of `natural`. only expose the modules that safely works
        // @note if you are modifying items to the `natural-*` list, then please sync the same in vendor/natural.js
        'natural-distance': { resolve: 'natural/lib/natural/distance', expose: 'natural/distance', glob: true },
        'natural-inflectors': { resolve: 'natural/lib/natural/inflectors', expose: 'natural/inflectors', glob: true },
        'natural-ngrams': { resolve: 'natural/lib/natural/ngrams', expose: 'natural/ngrams', glob: true },
        'natural-normalizers': { resolve: 'natural/lib/natural/normalizers', expose: 'natural/normalizers',
            glob: true },
        'natural-phonetics': { resolve: 'natural/lib/natural/phonetics', expose: 'natural/phonetics', glob: true },
        'natural-analyzers': { resolve: 'natural/lib/natural/analyzers', expose: 'natural/analyzers', glob: true },
        'natural-sentiment': { resolve: 'natural/lib/natural/sentiment', expose: 'natural/sentiment', glob: true },
        'natural-stemmers': { resolve: 'natural/lib/natural/stemmers', expose: 'natural/stemmers', glob: true },
        'natural-tfidf': { resolve: 'natural/lib/natural/tfidf', expose: 'natural/tfidf', glob: true },
        'natural-tokenizers': { resolve: 'natural/lib/natural/tokenizers', expose: 'natural/tokenizers', glob: true },
        'natural-transliterators': { resolve: 'natural/lib/natural/transliterators', expose: 'natural/transliterators',
            glob: true },
        'natural-trie': { resolve: 'natural/lib/natural/trie', expose: 'natural/trie', glob: true },
        'natural-wordnet': { resolve: 'natural/lib/natural/wordnet', expose: 'natural/wordnet', glob: true }
    },
    ignore: ['aws4', 'hawk', 'node-oauth1'],
    files: {
        '../vendor/sugar': true, // sugar is tricky as module. hence included as vendor.
        '../sandbox': true
    }
};
