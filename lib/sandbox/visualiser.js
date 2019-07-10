module.exports = {
    /**
     * Set visualiser template and its options
     *
     * @param {String} template - visualisation layout in form of template
     * @param {Object} options - options to use while processing the template
     * @param {Object} options.data - data object to be used in template
     * @param {Object} options.hanadlebarsOptions - hanadlebars options to use while compiling template
     */
    set: function (template, options) {
        this.return.visualiser = {
            template: template,
            options: options
        };
    },

    /**
     * Clear all visualiser data
     */
    clear: function () {
        this.return.visualiser = undefined;
    }
};
