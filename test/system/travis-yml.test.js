/* global describe, it */
var expect = require('expect.js');

describe('travis.yml', function () {
    var fs = require('fs'),
        yaml = require('js-yaml'),
        travisYAML,
        travisYAMLError;

    try {
        travisYAML = yaml.safeLoad(fs.readFileSync('.travis.yml').toString());
    }
    catch (e) {
        travisYAMLError = e;
    }

    it('should exist', function (done) {
        fs.stat('.travis.yml', done);
    });

    it('should be a valid yml', function () {
        expect(travisYAMLError && travisYAMLError.message || travisYAMLError).to.not.be.ok();
    });

    describe('strucure', function () {
        it('should have the language set to node', function () {
            expect(travisYAML.language).to.be('node_js');
            expect(travisYAML.node_js).to.eql(['6', '5', '4']);
        });

        it('should have a valid Slack notification token', function () {
            expect(travisYAML.notifications.slack.secure).to.be.ok();
        });
    });
});
