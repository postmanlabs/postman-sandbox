var fs = require('fs'),
    yaml = require('js-yaml'),
    expect = require('chai').expect;

describe('travis.yml', function () {
    var travisYAML,
        travisYAMLError;

    try {
        travisYAML = yaml.load(fs.readFileSync('.travis.yml').toString());
    }
    catch (e) {
        travisYAMLError = e;
    }

    it('should exist', function (done) {
        fs.stat('.travis.yml', done);
    });

    it('should be a valid yml', function () {
        expect(travisYAMLError && travisYAMLError.message || travisYAMLError).to.be.undefined;
    });

    describe('structure', function () {
        it('should have the language set to node', function () {
            expect(travisYAML.language).to.equal('node_js');
            expect(travisYAML.node_js).to.eql([10, 12]);
        });

        it('should have a valid Slack notification token', function () {
            expect(travisYAML.notifications.slack.secure,
                '"secure" not configured in incoming_webhook').to.be.ok;
        });
    });
});
