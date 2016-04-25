/* nrdb-local.js
 * Written by Dominic Shelton.
 * Provides functions for searching and storing a local copy of the netrunnedb card database.
 */
'use strict';
var request = require('request');
var schedule = require('node-schedule');
var FuzzySearch = require('fuzzysearch-js');
var LevenshteinFS = require('fuzzysearch-js/js/modules/LevenshteinFS');
var IndexOfFS = require('fuzzysearch-js/js/modules/IndexOfFS');
// var SiftFS = require('fuzzysearch-js/js/modules/Sift3FS');

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

// Cards in a decklist need a type and quantity, return them via promise.
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
                    // The ICE type must be further broken into subtypes.
                    if (type === 'ICE') {
                        var typematch = card.card.subtype.match(/(Barrier|Code\ Gate|Sentry)/g);
                        if (!typematch) {
                            // The ice matched no standard type
                            type = 'Other';
                        } else if (typematch.length > 1) {
                            // The ice matched multiple types
                            type = 'Multi';
                        } else {
                            // The ice matched only a single type
                            type = typematch[0];
                        }
                    // Likewise Icebreakers must be separated from programs.
                    } else if (type === 'Program' && card.card.subtype
                            && card.card.subtype.match(/Icebreaker/)) {
                        type = 'Icebreaker';
                    }
                    // Add the card to the array of the correct type.
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

// Get a card by its nrdb code.
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

// Search for a card by title text (fuzzy)
function getCardByTitle (text) {
    text = text.trim();
    return new Promise (function (resolve, reject) {
        if (text.length < 2) {
            resolve(undefined);
        } else {
            indexPromise.then(function (cardArray) {
                // Perform a fuzzy search for the card title.
                var results = fuzzySearch.search(text);
                if (results) {
                    // Output the fuzzysearch score for each card found on the console.
                    // console.info('\n\nSearching for ' + text);
                    // results.forEach((result, i) => {
                    //     var details = '';
                    //     result.details.forEach((detail) => {
                    //         details += detail.name + ': ' + detail.score + ' ';
                    //     });
                    //     console.info(i +': ' + result.value.title + ' score: ' + result.score + '\t\t' + details);
                    // });
                    // Return the best hit.
                    resolve(results[0].value);
                }else{
                    // Fall back to an acronym search.
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

// Initialise the local card array
function init (cardArray) {
    // Initialised as a promise so requests can be queued while the db is downloading.
    initPromise = new Promise (function (resolve, reject) {
        if (cardArray) {
            console.log('Used passed card DB');
            resolve(cardArray);
        } else {
            // Load the json data from netrunnerdb.
            request(netrunnerCardURL, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    var date = new Date(response.headers.expires);
                    cardArray = JSON.parse(body);
                    if (scheduledUpdate) {
                        scheduledUpdate.cancel();
                    }
                    console.log('Fetched card DB, valid until '+date);
                    // Schedule the init method to be called again when the data expires.
                    scheduledUpdate = schedule.scheduleJob(date, init);
                    resolve(cardArray);
                } else {
                    console.error('Failed to fetch card DB: error %u', response.statusCode);
                    reject (error);
                }
            });
        }
    });
    // Create another promise for the search indexing of the db so that title searches can be queued.
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
            // fuzzySearch.addModule(SiftFS({'maxDistanceTolerance': 4, 'factor': 1}));
            fuzzySearch.addModule(LevenshteinFS({'maxDistanceTolerance': 4, 'factor': 1}));
            resolve(cardArray);
        }, function (error) {
            reject (error);
        });
    });
    return indexPromise;
}
