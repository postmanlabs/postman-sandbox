function _onTagged (doclet, tag) {
    doclet.description = `${doclet.description}\n@${tag.originalTitle}`;
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
