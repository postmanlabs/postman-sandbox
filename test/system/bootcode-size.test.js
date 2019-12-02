const fs = require('fs'),
    path = require('path'),
    CACHE_DIR = path.join(__dirname, '/../../.cache'),
    THRESHOLD = 4 * 1024 * 1024; // 4 MB

describe('bootcode size', function () {
    this.timeout(60 * 1000);

    it('should not exceed the threshold', function (done) {
        fs.readdir(CACHE_DIR, function (err, files) {
            if (err) { return done(err); }

            files.forEach(function (file) {
                var size = fs.statSync(CACHE_DIR + '/' + file).size;

                expect(size, (file + ' threshold exceeded')).to.be.below(THRESHOLD);
            });

            done();
        });
    });
});
