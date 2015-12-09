'use strict';
var request = require('request');
var schedule = require('node-schedule');

var netrunnerdbURL = 'http://netrunnerdb.com/api/cards/';

module.exports = {
    init: function () {
        var self = this;
        return new Promise (function (resolve, reject) {
            request(netrunnerdbURL, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var date = Date(response.headers.expires);
                    self.cards = JSON.parse(body);
                    if (self.updater) {
                        self.updater.cancel();
                    }
                    console.log("Fetched card DB");
                    self.updater = schedule.scheduleJob(date, self.init);
                    for (var c in self.cards) {
                        self.cardsByCode[self.cards[c].code] = self.cards[c];
                    }
                    resolve();
                } else {
                    console.error("Failed to fetch card db: error %s", response.statusCode);
                    reject (error);
                }
            });
        });
    },
    getCardByTitle: function () {
        return null;
    },
    cards: null,
    cardsByCode: {},
    updater: null
}

