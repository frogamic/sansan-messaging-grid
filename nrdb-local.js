'use strict';
var request = require('request');
var schedule = require('node-schedule');
var FuzzySearch = require('fuzzysearch-js');
// var LevenshteinFS = require('fuzzysearch-js/js/modules/LevenshteinFS');
var IndexOfFS = require('fuzzysearch-js/js/modules/IndexOfFS');
var SiftFS = require('fuzzysearch-js/js/modules/Sift3FS');

var netrunnerCardURL = 'http://netrunnerdb.com/api/cards/';
var netrunnerDeckURL = 'http://netrunnerdb.com/api/decklist/';
var netrunnerDeckDisplayURL = 'http://netrunnerdb.com/en/decklist/';
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
};

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
            decklist.url = netrunnerDeckDisplayURL + id;
            decklist.creator = deck.username;
            for (let code in deck.cards) {
                promises.push(createDecklistCard(code, deck.cards[code]));
            }
            Promise.all(promises).then(function (values) {
                values.forEach((card, i) => {
                    var type = card.card.type;
                    if (type === 'ICE') {
                        var typematch = card.card.subtype.match(/(Barrier|Code\ Gate|Sentry)/g);
                        if (!typematch) {
                            type = 'Other';
                        } else if (typematch.length > 1) {
                            type = 'Multi';
                        } else {
                            type = typematch[0];
                        }
                    } else if (type === 'Program' && card.card.subtype
                            && card.card.subtype.match(/Icebreaker/)) {
                        type = 'Icebreaker';
                    }
                    if (!decklist.cards[type]) {
                        decklist.cards[type] = [];
                    }
                    decklist.cards[type].push({
                        quantity: card.quantity, card: card.card
                    });
                });
                for (let type in decklist.cards) {
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
    text = text.trim();
    return new Promise (function (resolve, reject) {
        if (text.length < 2) {
            resolve(undefined);
        } else {
            indexPromise.then(function (cardArray) {
                var results = fuzzySearch.search(text);
                if (results) {
                    // console.info('\n\nSearching for ' + text);
                    // results.forEach((result, i) => {
                    //     var details = '';
                    //     result.details.forEach((detail) => {
                    //         details += detail.name + ': ' + detail.score + ' ';
                    //     });
                    //     console.info(i +': ' + result.value.title + ' score: ' + result.score + '\t\t' + details);
                    // });
                    resolve(results[0].value);
                }else{
                    var acronym = new RegExp(text.replace(/\W/g, '').replace(/(.)/g, '\\b$1.*?'), 'i');
                    var result = cardArray.find(function (e) {
                        return e.title.match(acronym);
                    });
                    resolve(result);
                }
            });
        }
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
            cardArray.forEach((card) => {
                cards[card.code] = card;
            });
            fuzzySearch = new FuzzySearch(cardArray, {
                'caseSensitive': false,
                'termPath': 'title',
                'minimumScore': 200
            });
            fuzzySearch.addModule(IndexOfFS({'minTermLength': 3, 'maxIterations': 500, 'factor': 2}));
            fuzzySearch.addModule(SiftFS({'maxDistanceTolerance': 6, 'factor': 1}));
            // fuzzySearch.addModule(LevenshteinFS({'maxDistanceTolerance': 6, 'factor': 1}));
            resolve(cardArray);
        }, function (error) {
            reject (error);
        });
    });
    return indexPromise;
}
