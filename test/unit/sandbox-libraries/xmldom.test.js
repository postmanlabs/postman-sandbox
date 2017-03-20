describe('sandbox library - xmldom', function () {
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
            assert.strictEqual(typeof DOMParser, 'function', 'typeof DOMParser must be object');          
        `, done);
    });

    describe('basic functionality', function () {
        it('must have basic functionality working', function (done) {
            context.execute(`
                var assert = require('assert'),
                    doc =  new DOMParser().parseFromString(\`${markup}\`, 'text/xml');
                assert.strictEqual(doc.getElementsByTagName('response').length, 1, 'Parsing must be valid');
                assert.strictEqual(doc.getElementsByTagName('time')[0].textContent, '20', 'Parsing must be valid');                
            `, done);
        });
    });
});
