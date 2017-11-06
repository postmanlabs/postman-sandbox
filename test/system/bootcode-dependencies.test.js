/* global describe, it */
var expect = require('expect.js');

describe('bootcode dependencies', function () {
    this.timeout(60 * 1000);

    var env = require('../../lib/environment'),
        Bundle = require('../../lib/bundle'),
        currentDependencies;

    before(function (done) {
        process && process.stdout.write('  -- building dependencies, please wait... ');
        Bundle.load(env).listDependencies(function (err, dependencies) {
            currentDependencies = dependencies;
            console.log(err ? 'failed' : 'done');
            return done(err);
        });
    });

    it('should not change', function () {
        expect(currentDependencies).to.be.eql([
            '8fold-marked',
            'array-uniq',
            'assert',
            'assertion-error',
            'atob',
            'backbone',
            'base64-js',
            'boolbase',
            'btoa',
            'buffer',
            'chai',
            'chai-postman',
            'charset',
            'check-error',
            'cheerio',
            'core-util-is',
            'crypto-js',
            'css-select',
            'css-what',
            'csv-parse',
            'deep-eql',
            'dom-serializer',
            'domelementtype',
            'domhandler',
            'domutils',
            'entities',
            'escape-html',
            'events',
            'file-type',
            'get-func-name',
            'htmlparser2',
            'http-reasons',
            'iconv-lite',
            'ieee754',
            'inherits',
            'isarray',
            'jquery',
            'liquid-json',
            'lodash',
            'lodash.assignin',
            'lodash.bind',
            'lodash.defaults',
            'lodash.escaperegexp',
            'lodash.filter',
            'lodash.flatten',
            'lodash.foreach',
            'lodash.map',
            'lodash.merge',
            'lodash.pick',
            'lodash.reduce',
            'lodash.reject',
            'lodash.some',
            'lodash3',
            'mime-db',
            'mime-format',
            'mime-types',
            'moment',
            'nth-check',
            'number-is-nan',
            'path-browserify',
            'pathval',
            'postman-collection',
            'postman-sandbox',
            'postman-url-encoder',
            'process',
            'process-nextick-args',
            'punycode',
            'querystring-es3',
            'readable-stream',
            'safe-buffer',
            'sanitize-html',
            'sax',
            'semver',
            'srcset',
            'stream-browserify',
            'string_decoder',
            'timers-browserify',
            'tv4',
            'type-detect',
            'underscore',
            'uniscope',
            'url',
            'util',
            'util-deprecate',
            'uuid',
            'xml2js',
            'xmlbuilder',
            'xtend'
        ]);
    });
});
