var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var nrdb = require('../nrdb-local');

describe('NetrunnerDB export', function () {
    it('should be an object', function (done) {
        expect(nrdb).to.be.an('object');
        done();
    });
    it('should contain methods for searching cards', function (done) {
        expect(nrdb).to.have.all.keys('init', 'getCardByCode', 'getCardByTitle', 'cards');
        expect(nrdb.init).to.be.a('function');
        expect(nrdb.getCardByCode).to.be.a('function');
        expect(nrdb.getCardByTitle).to.be.a('function');
        expect(nrdb.cards).to.be.null;
        done();
    });
    it('should be initializable', function () {
        this.timeout(6000);
        return nrdb.init();
    });
    it('should contain cards after initializing', function (done) {
        expect(nrdb.cards).to.be.an('array');
        done();
    });
    it('should contain some known cards', function (done) {
        nrdb.cards.find(function (c) {
            return c.code === '00005';
        }).title.should.equal('The Shadow: Pulling the Strings');
        nrdb.cards.find(function (c) {
            return c.code === '06088';
        }).title.should.equal('Executive Boot Camp');
        done();
    });
});

