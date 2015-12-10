'use strict';
var request = require('request');
var schedule = require('node-schedule');
var si = require('search-index')({
    deletable:false,
    fieldsToStore:['id', 'title'],
    nGramLength: {gte: 1, lte: 3}
});

var netrunnerdbURL = 'http://netrunnerdb.com/api/cards/';
var cards = {};
var scheduledUpdate;
var initPromise;
var indexPromise;

module.exports = {
    init: init,
    getCardByTitle: getCardByTitle,
    getCardByCode: getCardByCode
}

function getCardByCode (code) {
    return new Promise (function (resolve, reject) {
        initPromise.then(function () {
            if (cards[code]) {
                resolve(cards[code]);
            } else {
                reject();
            }
        });
    });
}

function getCardByTitle (text) {
    return new Promise (function (resolve, reject) {
        indexPromise.then(function () {
            si.search({query:  {title: [text]}}, function (err, searchResults) {
                if (err) {
                    reject(err);
                } else {
                    if(searchResults.totalHits > 0) {
                        resolve(cards[searchResults.hits[0].code]);
                    } else {
                        reject('no hits');
                    }
                }
            });
        });
    });
}

function init (cardArray) {
    initPromise = new Promise (function (resolve, reject) {
        if (cardArray) {
            console.log('Used passed card DB');
            resolve(cardArray);
        } else {
            request(netrunnerdbURL, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var date = new Date(response.headers.expires);
                    cardArray = JSON.parse(body);
                    if (scheduledUpdate) {
                        scheduledUpdate.cancel();
                    }
                    console.log('Fetched card DB, valid until '+date);
                    scheduledUpdate = schedule.scheduleJob(date, init);
                    resolve(cardArray);
                } else {
                    console.error('Failed to fetch card DB: error %u', response.statusCode);
                    reject (error);
                }
            });
        }
    });
    indexPromise = new Promise (function (resolve, reject) {
        initPromise.then(function(cardArray) {
            for (var i = 0; i < cardArray.length; i++) {
                cards[cardArray[i].code] = cardArray[i];
                cards[cardArray[i].code].id = parseInt(cardArray[i].code);
            }
            si.empty();
            si.add(cardArray, {}, function (error) {
                if (!error){
                    console.log('Cards added to search-index');
                    resolve();
                } else {
                    console.error('Failed to add cards to search-index');
                    reject (error);
                }
            });
        }, function (error) {
            reject (error);
        });
    });
    return indexPromise;
}
