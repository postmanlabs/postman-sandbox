/**
 * @fileOverview This test specs runs tests on the package.json file of repository. It has a set of strict tests on the
 * content of the file as well. Any change to package.json must be accompanied by valid test case in this spec-sheet.
 */
var _ = require('lodash'),
    yml = require('js-yaml'),
    parseIgnore = require('parse-gitignore'),
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
                    description: 'Sandbox for Postman Scripts to run in NodeJS or Chrome',
                    author: 'Postman Labs <help@getpostman.com> (=)',
                    license: 'Apache-2.0'
                });
            });

            it('should have a valid version string in form of <major>.<minor>.<revision>', function () {
                expect(json.version)
                    // eslint-disable-next-line max-len
                    .to.match(/^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/);
            });
        });

        describe('script definitions', function () {
            it('should be present', function () {
                expect(json.scripts).to.be.ok;
            });

            describe('element', function () {
                json.scripts && Object.keys(json.scripts).forEach(function (scriptName) {
                    describe(scriptName, function () {
                        it('should point to a file', function () {
                            expect(json.scripts[scriptName]).to.match(/^node\snpm\/.+\.js(\s\$1)?$/);
                            expect(fs.statSync('npm/' + scriptName + '.js')).to.be.ok;
                        });
                    });
                });
            });

            it('should have the hashbang defined', function () {
                json.scripts && Object.keys(json.scripts).forEach(function (scriptName) {
                    var fileContent = fs.readFileSync('npm/' + scriptName + '.js').toString();
                    expect(fileContent).to.match(/^#!\/(bin\/bash|usr\/bin\/env\snode)[\r\n][\W\w]*$/g);
                });
            });
        });

        describe('devDependencies', function () {
            it('should exist', function () {
                expect(json.devDependencies).to.be.an('object');
            });

            it('should point to a valid semver', function () {
                Object.keys(json.devDependencies).forEach(function (dependencyName) {
                    expect(json.devDependencies[dependencyName]).to.match(new RegExp('((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
                        '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$'));
                });
            });
        });

        describe('main entry script', function () {
            it('should point to a valid file', function (done) {
                expect(json.main).to.equal('index.js');
                fs.stat(json.main, done);
            });
        });

        describe('greenkeeper', function () {
            it('should ignore mocha (v5.0.2 and beyond truncate browser tests)', function () {
                expect(json.devDependencies).to.have.property('mocha', '5.0.1');
                expect(json.greenkeeper).to.eql({
                    ignore: ['mocha', 'csv-parse']
                });
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
            expect(yml.safeLoad(fs.readFileSync('./CHANGELOG.yaml')), 'not a valid yaml').to.be.ok;
        });
    });

    describe('.ignore files', function () {
        var gitignorePath = '.gitignore',
            npmignorePath = '.npmignore',
            npmignore = parseIgnore(fs.readFileSync(npmignorePath)),
            gitignore = parseIgnore(fs.readFileSync(gitignorePath));

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
