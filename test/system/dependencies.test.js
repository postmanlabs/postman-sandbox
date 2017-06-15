/* global describe, it */
var expect = require('expect.js');

describe('dependencies', function () {
    var env = require('../../lib/environment'),
        Bundle = require('../../lib/bundle'),
        currentDependencies;

    before(function (done) {
        this.timeout(5000);
        Bundle.load(env).listDependencies(function (err, dependencies) {
            currentDependencies = dependencies;
            return done(err);
        });
    });

    it('should not change', function () {
        expect(currentDependencies).to.be.eql([
            'assert',
            'assertion-error',
            'atob',
            'backbone',
            'base64-js',
            'boolbase',
            'browserify',
            'btoa',
            'buffer',
            'chai',
            'charset',
            'check-error',
            'cheerio',
            'core-util-is',
            'crypto-js',
            'css-select',
            'css-what',
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
            'marked',
            'mime-db',
            'mime-format',
            'mime-types',
            'moment',
            'nth-check',
            'path-browserify',
            'pathval',
            'postman-collection',
            'postman-sandbox',
            'process',
            'process-nextick-args',
            'readable-stream',
            'regexp-quote',
            'safe-buffer',
            'sanitize-html',
            'sax',
            'semver',
            'string_decoder',
            'timers-browserify',
            'tv4',
            'type-detect',
            'underscore',
            'uniscope',
            'util',
            'util-deprecate',
            'uuid',
            'xml2js',
            'xmlbuilder',
            'xtend'
        ]);
    });
});
