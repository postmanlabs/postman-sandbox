/**
 * @fileOverview This test specs runs tests on the package.json file of repository. It has a set of strict tests on the
 * content of the file as well. Any change to package.json must be accompanied by valid test case in this spec-sheet.
 */
var _ = require('lodash'),
    yml = require('js-yaml'),
    parseIgnore = require('parse-gitignore'),
    expect = require('chai').expect,
    fs = require('fs');

describe('project repository', function () {
    describe('package.json', function () {
        var content,
            json;

        try {
            content = fs.readFileSync('./package.json').toString();
            json = JSON.parse(content);
        }
        catch (e) { } // eslint-disable-line no-empty

        it('should exist', function (done) {
            fs.stat('./package.json', done);
        });

        it('should have readable content', function () {
            expect(content, 'Should have readable content').to.be.a('string');
        });

        it('should have valid JSON content', function () {
            expect(json, 'Should have valid JSON content').to.be.an('object');
        });

        describe('package.json JSON data', function () {
            it('should have valid name, description, author and license', function () {
                expect(json).to.deep.include({
                    name: 'postman-sandbox',
                    description: 'Sandbox for Postman Scripts to run in Node.js or browser',
                    author: 'Postman Inc.',
                    license: 'Apache-2.0'
                });
            });

            it('should have a valid version string in form of <major>.<minor>.<revision>', function () {
                expect(json.version)
                    // eslint-disable-next-line @stylistic/js/max-len, security/detect-unsafe-regex
                    .to.match(/^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/);
            });
        });

        describe('dependencies', function () {
            it('should exist', function () {
                expect(json.dependencies).to.be.an('object');
            });

            it('should point to specific package version; (*, ^, ~) not expected', function () {
                _.forEach(json.dependencies, function (dep) {
                    expect((/^\d/).test(dep)).to.be.ok;
                });
            });
        });

        describe('devDependencies', function () {
            it('should exist', function () {
                expect(json.devDependencies).to.be.an('object');
            });

            it('should point to a valid semver', function () {
                Object.keys(json.devDependencies).forEach(function (dependencyName) {
                    // eslint-disable-next-line security/detect-non-literal-regexp
                    expect(json.devDependencies[dependencyName]).to.match(new RegExp('((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
                        '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$'));
                });
            });

            it('should point to specific package version for bundled packages; (*, ^, ~) not expected', function () {
                [
                    'ajv', 'assert', 'backbone', 'buffer', 'chai',
                    'chai-postman', 'cheerio', 'crypto-js', 'csv-parse', 'liquid-json',
                    'lodash3', 'moment', '@postman/tough-cookie', 'tv4',
                    'uniscope', 'xml2js'
                ].forEach(function (dep) {
                    expect((/^\d/).test(json.devDependencies[dep]), `${dep} check failed`).to.be.ok;
                });
            });

            // @note updating csv-parse will break postman script because of breaking
            // API and options changes introduced in csv-parse
            it('should have csv-parse v1.2.4', function () {
                expect(json.devDependencies).to.have.property('csv-parse', '1.2.4');
            });

            // @note crypto-js v4 uses native crypto module which will not work after browserify
            it('should have crypto-js v3.3.0', function () {
                expect(json.devDependencies).to.have.property('crypto-js', '3.3.0');
            });

            // @note Ajv v7 will break postman script because of breaking API
            // and dropped support for draft-04 schemas
            it('should have ajv v6.12.5', function () {
                expect(json.devDependencies).to.have.property('ajv', '6.12.5');
            });
        });

        describe('main entry script', function () {
            it('should point to a valid file', function (done) {
                expect(json.main).to.equal('index.js');
                fs.stat(json.main, done);
            });
        });
    });

    describe('README.md', function () {
        it('should exist', function (done) {
            fs.stat('./README.md', done);
        });

        it('should have readable content', function () {
            expect(fs.readFileSync('./README.md').toString()).to.be.ok;
        });
    });

    describe('LICENSE.md', function () {
        it('should exist', function (done) {
            fs.stat('./LICENSE.md', done);
        });

        it('should have readable content', function () {
            expect(fs.readFileSync('./LICENSE.md').toString()).to.be.ok;
        });
    });

    describe('.gitattributes', function () {
        it('should exist', function (done) {
            fs.stat('./.gitattributes', done);
        });

        it('should have readable content', function () {
            expect(fs.readFileSync('./.gitattributes').toString()).to.be.ok;
        });
    });

    describe('CHANGELOG.yaml', function () {
        it('should exist', function (done) {
            fs.stat('./CHANGELOG.yaml', done);
        });

        it('should have readable content', function () {
            expect(yml.load(fs.readFileSync('./CHANGELOG.yaml')), 'not a valid yaml').to.be.ok;
        });
    });

    describe('.ignore files', function () {
        var gitignorePath = '.gitignore',
            npmignorePath = '.npmignore',
            npmignore = parseIgnore(fs.readFileSync(npmignorePath)).patterns,
            gitignore = parseIgnore(fs.readFileSync(gitignorePath)).patterns;

        describe(gitignorePath, function () {
            it('should exist', function (done) {
                fs.stat(gitignorePath, done);
            });

            it('should have valid content', function () {
                expect(gitignore).to.not.be.empty;
            });

            it('should not ignore the .cache directory', function () {
                expect(gitignore).to.include.members(['.cache']);
            });
        });

        describe(npmignorePath, function () {
            it('should exist', function (done) {
                fs.stat(npmignorePath, done);
            });

            it('should have valid content', function () {
                expect(gitignore).to.not.be.empty;
            });

            it('should not ignore the .cache directory', function () {
                expect(npmignore).to.not.include('**/.cache');
                expect(npmignore).to.not.include('**/.cache/**');
            });
        });

        it('.gitignore coverage must be a subset of .npmignore coverage (except .cache directory)', function () {
            expect(_.intersection(gitignore, _.union(npmignore, ['.cache']))).to.eql(gitignore);
        });
    });
});
