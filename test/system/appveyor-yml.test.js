/* global describe, it */
var expect = require('expect.js');

describe('appveyor.yml', function () {
    var fs = require('fs'),
        yaml = require('js-yaml'),

        appveyorYAML,
        appveyorYAMLError;

    try {
        appveyorYAML = yaml.safeLoad(fs.readFileSync('appveyor.yml').toString());
    }
    catch (e) {
        appveyorYAMLError = e;
    }

    it('should exist', function (done) {
        fs.stat('appveyor.yml', done);
    });

    it('should be a valid yml', function () {
        expect(appveyorYAMLError && appveyorYAMLError.message || appveyorYAMLError).to.not.be.ok();
    });

    describe('structure', function () {
        it('should have an init script', function () {
            expect(appveyorYAML.init[0]).to.be('git config --global core.autocrlf input');
        });

        it('should match the Travis environment matrix', function () {
            var travisYAML,
                travisYAMLError,
                appveyorNodeVersions = appveyorYAML.environment.matrix.map(function (member) {
                    return member.nodejs_version;
                });

            try {
                travisYAML = yaml.safeLoad(fs.readFileSync('.travis.yml').toString());
            }
            catch (e) {
                travisYAMLError = e;
            }

            !travisYAMLError && expect(travisYAML.node_js).to.eql(appveyorNodeVersions);
        });

        it('should have correct install scripts', function () {
            expect(appveyorYAML.install[0].ps).to.be('Install-Product node $env:nodejs_version');
            expect(appveyorYAML.install[1]).to.be('npm cache clean');
            expect(appveyorYAML.install[2]).to.be('appveyor-retry npm install');
        });

        it('should have the MS build script and deploy must be turned off', function () {
            expect(appveyorYAML.build).to.be('off');
            expect(appveyorYAML.deploy).to.be('off');
        });

        it('should have notifications must be configured correctly', function () {
            expect(appveyorYAML.notifications).to.be.an(Array);
            expect(appveyorYAML.notifications[0].provider).to.be('Slack');
            expect(appveyorYAML.notifications[0].incoming_webhook.secure).to.be.ok();
        });
    });
});
