/**
 * `natural` is an npm module that we provide to our users. However, the module does not do
 * well as a direct `require` within Postman Sandbox. So, we firstly provide partial imports as
 * defined within `environment.js`. However, for the popular usage structure, we are reproducing the
 * rough structure of the natural base module and excluding the erroneous bits from it.
 */

/**
 * This is a helper function to build the module exportables. This is adapted from the natural module itself
 * @param {Array} modules
 * @returns {Object}
 *
 * @todo somebody replace this with array reduce style code.
 */
function buildExportMap (modules) {
    const result = {};

    modules.forEach(module => {
        Object.keys(module).forEach(key => {
            result[key] = module[key];
        });
    })

    return result;
};

// adaptation from https://github.com/NaturalNode/natural/blob/master/lib/natural/index.js
module.exports = buildExportMap([
    // require('natural/lib/natural/brill_pos_tagger'), // @todo no idea why this was excluded. there were reasons!
    // require('natural/lib/natural/classifiers'), // @todo has issues loading web-worker threads
    require('natural/lib/natural/distance'),
    require('natural/lib/natural/inflectors'),
    require('natural/lib/natural/ngrams'),
    require('natural/lib/natural/normalizers'),
    require('natural/lib/natural/phonetics'),
    require('natural/lib/natural/analyzers'),
    require('natural/lib/natural/sentiment'),
    // require('natural/lib/natural/spellcheck'), // @todo no idea why this was excluded. there were reasons!
    require('natural/lib/natural/stemmers'),
    require('natural/lib/natural/tfidf'),
    require('natural/lib/natural/tokenizers'),
    require('natural/lib/natural/transliterators'),
    require('natural/lib/natural/trie'),
    // require('natural/lib/natural/util'), // @todo has entire db drivers in it! can't have that in sandbox
    require('natural/lib/natural/wordnet')
]);
