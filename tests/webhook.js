var chai = require('chai');
var chaiHttp = require('chai-http');

chai.use(chaiHttp);
var expect = chai.expect;
var should = chai.should();

var webhook = require('../webhook');

var irrelevantRequest = {
    token:'',
    team_id:'T0001',
    team_domain:'example',
    channel_id:'C2147483705',
    channel_name:'test',
    timestamp:'1355517523.000005',
    user_id:'U2147483697',
    user_name:'Steve',
    text:'random comment about netrunner',
    trigger_word:''
}

describe('Post request', function() {
    it('should respond to POST requests', function (done) {
        chai.request(webhook.app)
            .post('/')
            .send(irrelevantRequest)
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            });
    });
    it('should respond to text containing no searches with an empty 200 status', function (done) {
        chai.request(webhook.app)
            .post('/')
            .send(irrelevantRequest)
            .end(function(err, res) {
                res.should.have.status(200);
                expect(res.body).be.empty;
                done();
            });
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

