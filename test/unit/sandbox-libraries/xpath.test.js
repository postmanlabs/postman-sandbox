describe('sandbox library - xpath', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        context,
        markup = `
            <?xml version="1.0" encoding="utf-8"?>
            <response version="1.0">
                <time>20</time>
                <results>
                    <total>1</total>
                    <docs>
                        <doc>                     
                            <identifiers>
                                <doi>10.2766/65538</doi>
                                <isbn>978-92-79-37860-7</isbn>
                                <catalogue_number>NC-02-13-772-02-N</catalogue_number>
                            </identifiers>                            
                            <publicationDate>2014-12-08</publicationDate>                     
                        </doc>                                                                 
                    </docs>
                </results>
            </response>`;

    beforeEach(function (done) {
        Sandbox.createContext({debug: true}, function (err, ctx) {
            context = ctx;
            done(err);
        });
    });

    afterEach(function () {
        context.dispose();
        context = null;
    });

    it('must exist', function (done) {
        context.execute(`
            var assert = require('assert');            
            assert.strictEqual(typeof xpath, 'object', 'typeof xpath must be object');
            assert.strictEqual(typeof xpath.XPathResult, 'function', 'typeof xpath.XPathResult must be object');
            assert.strictEqual(typeof xpath.evaluate, 'function', 'typeof xpath.evaluate must be function');
            assert.strictEqual(typeof xpath.select, 'function', 'typeof xpath.select must be function');
        `, done);
    });

    describe('basic functionality', function () {
        it('must work with select', function (done) {
            context.execute(`
                var assert = require('assert'),                                     
                    xmlDoc = new DOMParser().parseFromString(\`${markup}\`, 'text/xml');
                   
                assert.strictEqual(xpath.select('/response/time/text()', xmlDoc)[0].toString(), '20', 'Node extraction must work correctly');
                
            `, done);
        });

        it('must work with evaluate', function (done) {
            context.execute(`
                var assert = require('assert'),                                     
                    xmlDoc = new DOMParser().parseFromString(\`${markup}\`, 'text/xml');                   
                assert.strictEqual(xpath.evaluate('boolean(/response/time)', xmlDoc, null, xpath.XPathResult.STRING_TYPE, null).stringValue, 'true', 'Node extraction must work correctly');
                
            `, done);
        });


    });
});
