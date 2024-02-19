const expect = require('chai').expect,
    // eslint-disable-next-line security/detect-child-process
    { execSync: exec } = require('child_process');

describe('npm publish', function () {
    // @note npm pack won't refresh the .cache because of prepublishOnly
    // but we make sure it's refreshed before running tests using pretest script
    const packageInfo = JSON.parse(exec('npm pack --dry-run --json'))[0],
        packagedFiles = packageInfo.files.map(({ path }) => { return path; });

    it('should have a valid package name', function () {
        expect(packageInfo.name).to.equal('postman-sandbox-custom-beta');
    });

    it('should include boot code in .cache', function () {
        expect(packagedFiles).to.include('.cache/bootcode.js');
        expect(packagedFiles).to.include('.cache/bootcode.browser.js');
    });

    it('should not publish unnecessary files', function () {
        const allowedFiles = ['index.js', 'package.json', 'LICENSE.md', 'README.md', 'CHANGELOG.yaml'];

        packagedFiles.map((path) => {
            expect(allowedFiles.includes(path) ||
                path.startsWith('lib/') ||
                path.startsWith('types/') ||
                path.startsWith('.cache/')).to.be.true;
        });
    });
});
