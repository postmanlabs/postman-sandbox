function _onTagged (doclet, tag) {
    doclet.description = `@${tag.originalTitle} ${doclet.description}`;
}

function defineTags (dictionary) {
    dictionary.defineTag('excludeFromPrerequestScript', {
        onTagged: _onTagged
    });

    dictionary.defineTag('excludeFromTestScript', {
        onTagged: _onTagged
    });
}

module.exports = { defineTags };
