describe('sandbox library - Cheerio', function () {
    this.timeout(1000 * 60);
    var Sandbox = require('../../../'),
        context,
        markup = `
            <ul id="fruits"><li class="apple">Apple</li><li class="orange">Orange</li><li class="pear">Pear</li></ul>
        `;

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

            assert.strictEqual(typeof cheerio, 'function', 'typeof cheerio must be object');
            assert.strictEqual(typeof cheerio.load, 'function', 'typeof cheerio.load must be function');
        `, done);
    });

    describe('basic functionality', function () {
        it('must work with selectors', function (done) {
            context.execute(`
                var assert = require('assert'),
                    $ = cheerio.load(\`${markup}\`);

                assert.strictEqual($('.apple', '#fruits').text(), 'Apple', 'Text extraction must work correctly');
                assert.strictEqual($('ul .pear').attr('class'), 'pear', 'Attribute extraction must work correctly');
                assert.strictEqual($('li[class=orange]').html(), 'Orange', 'Attribute extraction must work correctly');
            `, done);
        });

        it('must work with attributes', function (done) {
            context.execute(`
                var assert = require('assert'),
                    $ = cheerio.load(\`${markup}\`);

                assert($('li').hasClass('pear'), 'Class missing');
                assert.strictEqual($('ul').attr('id'), 'fruits', 'Attributes must work correctly');
                assert.strictEqual($.html($('.apple').addClass('fruit red')), '<li class="apple fruit red">Apple</li>',
                    'Attributes should be mutated correctly');
                assert.strictEqual($.html($('.pear').removeAttr('class')), '<li>Pear</li>', 'HTML must be valid');
            `, done);
        });

        it('must work with traversals', function (done) {
            context.execute(`
                var assert = require('assert'),
                    $ = cheerio.load(\`${markup}\`);

                assert.strictEqual($('#fruits').find('li').length, 3, 'Array representation must be valid');
                assert.strictEqual($('#fruits').find($('.apple')).length, 1, 'Element filtering must be valid');
                assert.strictEqual($('.pear').parent().attr('id'), 'fruits', 'Parent traversal must be valid');
                assert($('.apple').next().hasClass('orange'), 'Adjacent node traversal must be valid');
                assert.strictEqual($('.pear').siblings().length, 2, 'Sibling traversal must be valid');
                assert.strictEqual($('#fruits').contents().length, 3, 'Child node traversal must be valid');
            `, done);
        });

        it('must work with renders', function (done) {
            context.execute(`
                var assert = require('assert'),
                    $ = cheerio.load(\`${markup}\`);

                assert.strictEqual($.html(), \`${markup}\`, 'HTML render must be valid');
            `, done);
        });
    });
});
