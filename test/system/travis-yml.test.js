var fs = require('fs'),
    yaml = require('js-yaml');

describe('travis.yml', function () {
    var travisYAML,
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
        expect(travisYAMLError && travisYAMLError.message || travisYAMLError).to.be.undefined;
    });

    describe('strucure', function () {
        it('should use the trusty Ubuntu distribution', function () {
            expect(travisYAML.dist).to.equal('trusty');
        });

        it('should have the language set to node', function () {
            expect(travisYAML.language).to.equal('node_js');
            expect(travisYAML.node_js).to.eql(['6', '8', '10']);
        });

        it('should have a valid Slack notification token', function () {
            expect(travisYAML.notifications.slack.secure,
                '"secure" not configured in incoming_webhook').to.be.ok;
        });
    });
});
