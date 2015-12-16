var chai = require('chai');

chai.use(require('chai-as-promised'));

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
        expect(nrdb).to.have.all.keys('init', 'getCardByCode', 'getCardByTitle', 'getDecklist');
        expect(nrdb.init).to.be.a('function');
        expect(nrdb.getCardByTitle).to.be.a('function');
        expect(nrdb.getCardByCode).to.be.a('function');
        expect(nrdb.getDecklist).to.be.a('function');
        done();
    });
    it('should be initializable', function () {
        this.timeout(10000);
        return nrdb.init(cards);
    });
    it('should find cards by code', function () {
        return expect(nrdb.getCardByCode('06088'))
            .to.eventually.have.property('title')
            .that.deep.equals("Executive Boot Camp");
    });
    it('should find cards by title', function () {
        return expect(nrdb.getCardByTitle('NAPD'))
            .to.eventually.have.property('code')
            .that.deep.equals('04119');
    });
    it('should find cards by partial title', function () {
        return expect(nrdb.getCardByTitle('hok'))
            .to.eventually.have.property('code')
            .that.deep.equals('02095');
    });
    it('should find cards by acronym', function () {
        return expect(nrdb.getCardByTitle('etf'))
            .to.eventually.have.property('code')
            .that.deep.equals('01054');
    });
});

