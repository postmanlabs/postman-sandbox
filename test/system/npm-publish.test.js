const expect = require('chai').expect,
    // eslint-disable-next-line security/detect-child-process
    { execSync: exec } = require('child_process');

describe('npm publish', function () {
    const buildSuccessMsg = 'bootcode ready for use!',
        npmPackOut = exec('npm pack --dry-run --json').toString(),
        packageInfo = JSON.parse(npmPackOut.substring(npmPackOut.indexOf(buildSuccessMsg) + buildSuccessMsg.length))[0];

    it('should have a valid package name', function () {
        expect(packageInfo.name).to.equal('postman-sandbox');
    });

    it('should not publish unnecessary files', function () {
        const allowedFiles = ['index.js', 'package.json', 'LICENSE.md', 'README.md', 'CHANGELOG.yaml'];

        packageInfo.files.map(({ path }) => {
            expect(allowedFiles.includes(path) ||
                path.startsWith('lib/') ||
                path.startsWith('types/') ||
                path.startsWith('.cache/')).to.be.true;
        });
    });
});
