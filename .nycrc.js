const TEST_TYPE = ((argv) => {
    let match = argv[argv.length - 1].match(/npm\/test-(\w+).js/);

    return match && match[1] || '';
})(process.argv);

function configOverrides(testType) {
    switch (testType) {
        case 'unit':
            return {
                statements: 60,
                branches: 40,
                functions: 40,
                lines: 60
            };
        default:
            return {}
    }
}

module.exports = {
    // @todo cover `all` files by writing unit test for bundled lib/sandbox files
    // all: true,
    'check-coverage': true,
    'report-dir': '.coverage',
    'temp-dir': '.nyc_output',
    include: ['lib/**/*.js'],
    reporter: ['lcov', 'json', 'text', 'text-summary'],
    ...configOverrides(TEST_TYPE),
};
