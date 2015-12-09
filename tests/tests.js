var chai = require('chai');
var chaiHttp = require('chai-http');

var webhook = require('../webhook');

chai.use(chaiHttp);
var expect = chai.expect;
var should = chai.should();

describe('Post request', function() {
    it('Should respond to POST requests', function (done) {
        chai.request(webhook)
            .post('/')
            .end(function(err, res) {
                res.should.have.status(200);
                done();
            });
    });
});

