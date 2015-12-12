var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var nrdb = require('../nrdb-local');
var cards = require('../cards.json'); // Use local copy instead of fetching a fresh copy

describe('NetrunnerDB object', function () {
    it('should be an object', function (done) {
        expect(nrdb).to.be.an('object');
        done();
    });
    it('should contain methods for searching cards', function (done) {
        expect(nrdb).to.have.all.keys('init', 'getCardByCode', 'getCardByTitle');
        expect(nrdb.init).to.be.a('function');
        expect(nrdb.getCardByTitle).to.be.a('function');
        expect(nrdb.getCardByCode).to.be.a('function');
        done();
    });
    it('should be initializable', function () {
        this.timeout(60000);
        return nrdb.init(cards);
    });
    it('should contain some known cards', function () {
        return nrdb.getCardByCode('06088');
    });
    it('should find cards by title', function () {
        return nrdb.getCardByTitle('NAPD');
    });
});

