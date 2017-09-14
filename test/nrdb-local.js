var chai = require('chai');

chai.use(require('chai-as-promised'));

var expect = chai.expect;
var should = chai.should();

var nrdb = require('../nrdb-local');
//var cards = require('../cards.json'); // Use local copy instead of fetching a fresh copy

describe('NetrunnerDB object', function () {
    it('should be an object', function (done) {
        expect(nrdb).to.be.an('object');
        done();
    });
    it('should contain methods for searching cards', function (done) {
        expect(nrdb).to.include.all.keys('init', 'getCardByCode', 'getCardByTitle');
        expect(nrdb.init).to.be.a('function');
        expect(nrdb.getCardByTitle).to.be.a('function');
        expect(nrdb.getCardByCode).to.be.a('function');
        done();
    });
    it('should be initializable', function () {
        this.timeout(20000);
        return nrdb.init();
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
    it('should return undefined when searching for card titles shorter than 2 ', function () {
        return expect(nrdb.getCardByTitle('a'))
            .to.eventually.equal(undefined);
    });
    it('should return undefined when card title can\'t be found', function () {
        return expect(nrdb.getCardByTitle('thiscarddefinitelywillneverexist'))
            .to.eventually.equal(undefined);
    });
    it('should reject when card code can\'t be found', function () {
        return expect(nrdb.getCardByCode('7'))
            .to.eventually.be.rejected
    });

    it('should contain methods for searching decklists', function (done) {
        expect(nrdb).to.include.all.keys('getDecklist');
        expect(nrdb.getDecklist).to.be.a('function');
        done();
    });
    it('should find valid decklists by ID', function () {
        this.timeout(10000);
        // https://netrunnerdb.com/en/decklist/1
        // First ever decklist, corp example
        expect(nrdb.getDecklist('1'))
            .to.eventually.be.a('object')
            .that.has.property('name')
            .that.equals('Tracing a Better World');
        // https://netrunnerdb.com/en/decklist/45359
        // Includes an other type ICE
        expect(nrdb.getDecklist('45359'))
            .to.eventually.be.a('object')
            .that.has.property('cards')
            .that.includes.key('Other');
        // https://netrunnerdb.com/en/decklist/30218
        // Includes a multi type ICE
        expect(nrdb.getDecklist('30218'))
            .to.eventually.be.a('object')
            .that.has.property('cards')
            .that.includes.key('Multi');
        // https://netrunnerdb.com/en/decklist/45363
        // Runner example
        return expect(nrdb.getDecklist('45363'))
            .to.eventually.be.a('object')
            .that.has.property('cards')
            .that.includes.key('Icebreaker');
    });
    it('should reject invalid decklists by ID', function () {
        this.timeout(10000);
        // https://netrunnerdb.com/en/decklist/2
        // doesn't exist - 404
        return expect(nrdb.getDecklist('2'))
            .to.eventually.be.rejected;
    });
});

