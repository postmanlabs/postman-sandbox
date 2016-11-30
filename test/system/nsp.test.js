/**
 * @fileOverview Ensures nsprc is as expected
 */

var fs = require('fs'),
    expect = require('expect.js');

/* global describe, it, before */
describe('nsp', function () {
    var nsprc,
        pkg;

    before(function () {
        nsprc = JSON.parse(fs.readFileSync('./.nsprc').toString());
        pkg = JSON.parse(fs.readFileSync('./package.json').toString());
    });

    it('should be a dev dependency', function () {
        expect(pkg.devDependencies && pkg.devDependencies.nsp).to.be.ok();
    });

    describe('nsprc', function () {
        it('should exist', function () {
            expect(nsprc).to.be.ok();
        });

        it('should not have any exceptions', function () {
            expect(nsprc.exceptions).to.eql([]);
        });

        it('should not have any exclusions', function () {
            expect(nsprc.exclusions).to.eql([]);
        });
    });
});
