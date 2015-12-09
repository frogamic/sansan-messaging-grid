var request = require('request');

module.exports = {
    init: function () {
        var self = this;
        return new Promise (function (resolve, reject) {
            request('http://netrunnerdb.com/api/cards/', function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    self.cards = JSON.parse(body);
                    resolve();
                } else {
                    reject (error);
                }
            });
        });
    },
    getCardByCode: function () {
        return null;
    },
    getCardByTitle: function () {
        return null;
    },
    cards: null
}

