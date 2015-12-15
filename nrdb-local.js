'use strict';
var request = require('request');
var schedule = require('node-schedule');
var FuzzySearch = require('fuzzysearch-js');
var LevenshteinFS = require('fuzzysearch-js/js/modules/LevenshteinFS');
var IndexOfFS = require('fuzzysearch-js/js/modules/IndexOfFS');

var netrunnerCardURL = 'http://netrunnerdb.com/api/cards/';
var netrunnerDeckURL = 'http://netrunnerdb.com/api/decklist/';
var cards = {};
var fuzzySearch;
var scheduledUpdate;
var initPromise;
var indexPromise;

module.exports = {
    init: init,
    getCardByTitle: getCardByTitle,
    getCardByCode: getCardByCode,
    getDecklist: getDecklist
}

function createDecklistCard (code, quantity) {
    return new Promise (function (resolve, reject) {
        getCardByCode(code).then(function (card) {
            var newCard = {};
            newCard.type = card.type;
            newCard.quantity = quantity;
            newCard.card = card;
            resolve(newCard);
        }, reject);
    });
}

function getDecklist (id) {
    return new Promise (function (resolve, reject) {
        request(netrunnerDeckURL + id, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                return reject(error);
            }
            var decklist = {cards: {}};
            var deck = JSON.parse(body);
            var promises = [];
            decklist.name = deck.name;
            decklist.url = netrunnerDeckURL + id;
            decklist.creator = deck.username;
            for (var code in deck.cards) {
                promises.push(createDecklistCard(code, deck.cards[code]));
            }
            Promise.all(promises).then(function (values) {
                for (var i in values) {
                    if (!decklist.cards[values[i].type]) {
                        decklist.cards[values[i].type] = [];
                    }
                    decklist.cards[values[i].type].push({
                        quantity: values[i].quantity, card: values[i].card
                    });
                }
                for (var type in decklist.cards) {
                    decklist.cards[type].sort(function (a, b) {
                        return a.card.title.localeCompare(b.card.title);
                    });
                }
                resolve(decklist);
            }, function (err) {
                console.log(err);
                reject (err)
            });
        });
    });
}

function getCardByCode (code) {
    return new Promise (function (resolve, reject) {
        initPromise.then(function () {
            if (cards[code]) {
                resolve(cards[code]);
            } else {
                reject(new Error('No hits'));
            }
        });
    });
}

function getCardByTitle (text) {
    return new Promise (function (resolve, reject) {
        indexPromise.then(function (cardArray) {
            var results = fuzzySearch.search(text);
            if (results) {
                // for (var i in results) {
                //     var details = '   ';
                //     for (var j in results[i].details) {
                //         details += results[i].details[j].name + ': ' + results[i].details[j].score + ' ';
                //     }
                //     console.info(i +': ' + results[i].value.title + ' score: ' + results[i].score + '\t\t' + details);
                // }
                resolve(results[0].value);
            }else{
                var acronym = new RegExp(text.replace(/\W/g, '').replace(/(.)/g, '\\b$1.*?'), 'i');
                var result = cardArray.find(function (e) {
                    return e.title.match(acronym);
                });
                resolve(result);
            }
        });
    });
}

function init (cardArray) {
    initPromise = new Promise (function (resolve, reject) {
        if (cardArray) {
            console.log('Used passed card DB');
            resolve(cardArray);
        } else {
            request(netrunnerCardURL, function (error, response, body) {
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
            }
            fuzzySearch = new FuzzySearch(cardArray, {
                'caseSensitive': false,
                'termPath': 'title',
                'minimumScore': 200
            });
            fuzzySearch.addModule(LevenshteinFS({'maxDistanceTolerance': 6, 'factor': 1}));
            fuzzySearch.addModule(IndexOfFS({'minTermLength': 3, 'maxIterations': 500, 'factor': 2}));
            resolve(cardArray);
        }, function (error) {
            reject (error);
        });
    });
    return indexPromise;
}
