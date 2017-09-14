var chai = require('chai');
var chaiHttp = require('chai-http');

chai.use(chaiHttp);
var expect = chai.expect;
var should = chai.should();

var webhook = require('../webhook');

var slackbotRequest = {
    token:'',
    team_id:'T0001',
    team_domain:'example',
    channel_id:'C2147483705',
    channel_name:'test',
    timestamp:'1355517523.000005',
    user_id:'U2147483697',
    user_name:'slackbot',
    text:'I am a robot something something [chop bot 3000]',
    trigger_word:''
}

var relevantRequest = {
    token:'',
    team_id:'T0001',
    team_domain:'example',
    channel_id:'C2147483705',
    channel_name:'test',
    timestamp:'1355517523.000005',
    user_id:'U2147483697',
    user_name:'Steve',
    text:'guyz shud i use [doppleganger] [boxe] or [disperado] in my [gabe] deck??',
    trigger_word:''
}

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

/*
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
    it('should respond to messages from slackbot with an empty 200 status', function (done) {
        chai.request(webhook.app)
            .post('/')
            .send(slackbotRequest)
            .end(function(err, res) {
                res.should.have.status(200);
                expect(res.body).be.empty;
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
    it('should respond to text containing searches with a slack message of those cards', function (done) {
        chai.request(webhook.app)
            .post('/')
            .send(relevantRequest)
            .end(function(err, res) {
                res.should.have.status(200);
                res.should.be.json;
                console.info(res.body);
                expect(JSON.parse(res.body)).to.deep.equal(
                {
                    text: '<http://netrunnerdb.com/en/card/02064|*\u200b◆ Doppelgänger\u200b*>',
                    attachments: [
                        {
                            pretext: '*\u200bHardware\u200b*: Console - :criminal:••\n3:credit:',
                            mrkdwn_in: ['pretext', 'text'],
                            color: '#0066cc',
                            text: '+:1mu:\nOnce per turn, you may immediately make another run when a successful run ends.\nLimit 1 *\u200bconsole\u200b* per player.'
                        },
                        {
                            pretext: '<http://netrunnerdb.com/en/card/06055|*\u200b◆ Box-E\u200b*>\n\u200b*Hardware\u200b*: Console - :criminal:•\n4:credit:',
                            mrkdwn_in: ['pretext', 'text'],
                            color: '#0066cc',
                            text: '+2 :mu:\nYour maximum hand size is increased by 2.\nLimit 1 *\u200bconsole\u200b* per player.'
                        },
                        {
                            pretext: '<http://netrunnerdb.com/en/card/01024|*\u200b◆ Desperado\u200b*>\n*\u200bHardware\u200b*: Console - :criminal:•••\n3:credit:',
                            mrkdwn_in: ['pretext', 'text'],
                            color: '#0066cc',
                            text: '+:1mu:\nGain 1:credit: whenever you make a successful run.\nLimit 1 *\u200bconsole\u200b* per player.'
                        },
                        {
                            pretext: '<http://netrunnerdb.com/en/card/01017|*\u200bGabriel Santiago: Consummate Professional\u200b*>\n*\u200bIdentity\u200b*: Cyborg - :criminal:\n45/15 - 0:link:',
                            mrkdwn_in: ['pretext', 'text'],
                            color: '#0066cc',
                            text: 'The first time you make a successful run on HQ each turn, gain 2:credit:.'
                        }
                    ]
                });
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
*/
