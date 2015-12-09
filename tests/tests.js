var chai = require('chai');
var chaiHttp = require('chai-http');

chai.use(chaiHttp);
var expect = chai.expect;
var should = chai.should();

var webhook = require('../webhook');
var formatting = require('../formatting');

describe('Post request', function() {
    it('should respond to POST requests', function (done) {
        chai.request(webhook.app)
            .post('/')
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            });
    });
});

describe('Card-text formatting', function() {
    it('should return a string', function (done) {
        expect(formatting.formatText('blah')).to.be.a('string');
        done();
    });
    it('should replace all click, trash and link symbols in with slack emoji', function (done) {
        expect(
            formatting.formatText('[Click][Click]\n [Trash] 2[Link]')
              ).to.equal(':click::click:\n :trash: 2:link:');
        done();
    });
    it('should replace all credit symbols in with slack emoji', function (done) {
        expect(
            formatting.formatText('1[Credits] \n2[Credits] 3[Recurring Credits]')
              ).to.equal('1:credit: \n2:credit: 3:recurring-credit:');
        done();
    });
    it('should replace subroutine symbols with emoji and insert newlines where appropriate', function (done) {
        expect(
            formatting.formatText('[Subroutine] End the run. [Subroutine] End the run.')
             ).to.equal(':subroutine: End the run.\n:Subroutine: End the run.');
        done();
    });
    it('should replace all memory symbols in with slack emoji', function (done) {
        expect(
            formatting.formatText('+1[Memory Unit] +2[Memory Unit]\n +3[Memory Unit] +4[Memory Unit] +X[Memory Unit] [Memory Unit]')
              ).to.equal('+:1mu: +:2mu:\n +:3mu: +:4mu: +:xmu: :mu:');
        done();
    });
    it('should add newlines to card text where appropriate', function (done) {
        expect(
            formatting.formatText('1[Credits]: do a thing. 2[Credits], [Trash]: do something else')
              ).to.equal('1:credit:: do a thing.\n2:credit:, :trash:: do something else');
        done();
    });
    it('should replace HTML bolding with slack bolding', function (done) {
        expect(
            formatting.formatText('<strong>Bold Text!!</strong>')
              ).to.equal('*\u200bBold Text!!\u200b*');
        done();
    });
    it('should replace HTML superscript with unicode superscript', function (done) {
        expect(
            formatting.formatText('[Subroutine] <strong>Trace<sup>1234567890X</sup></strong>– If successful, trash a piece of hardware. If your trace strength is 5 or greater, trash a piece of hardware with a cost of 1[Credits].')
              ).to.equal(':subroutine: *\u200bTrace¹²³⁴⁵⁶⁷⁸⁹⁰ˣ\u200b*– If successful, trash a piece of hardware. If your trace strength is 5 or greater, trash a piece of hardware with a cost of 1:credit:.');
        done();
    });
});

describe('Card title formatting', function() {
    it('should return a string without being passed a url', function (done) {
        expect(formatting.formatTitle('blah', 'www.example.com')).to.be.a('string');
        done();
    });
    it('should return a string when passed a url', function (done) {
        expect(formatting.formatTitle('blah')).to.be.a('string');
        done();
    });
    it('should create titles with URLs', function (done) {
        expect(formatting.formatTitle('NBN: The World is Yours*', 'http://netrunnerdb.com/en/card/02114'))
            .to.equal('<http://netrunnerdb.com/en/card/02114|*\u200bNBN: The World is Yours*\u200b*>');
        done();
    });
    it('should create titles without URLs', function (done) {
        expect(formatting.formatTitle('NBN: The World is Yours*'))
            .to.equal('*\u200bNBN: The World is Yours*\u200b*');
        done();
    });
});

describe('Search string finding', function() {
    it('should always return an array', function (done) {
        expect(webhook.findSearchStrings('guize should I use [desperado] or [box e]')).to.be.an('array');
        expect(webhook.findSearchStrings('I\'m not searching nrdb')).to.be.an('array');
        done();
    });
    it('should find all items within square brackets', function (done) {
        var hits = webhook.findSearchStrings('[house of knives], [nisei] and [fetal ai] are jinteki agendas');
        expect(hits).to.have.length.of(3);
        expect(hits).to.include.members(['house of knives', 'nisei', 'fetal ai']);
        done();
    });
    it('should find nothing when no square brackets are present', function (done) {
        var hits = webhook.findSearchStrings('Something unrelated');
        expect(hits).to.have.length(0);
        done();
    });
});

