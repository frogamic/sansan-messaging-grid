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

var nrdbCardURL = 'https://netrunnerdb.com/api/2.0/public/cards';
var nrdbMWLURL = 'https://netrunnerdb.com/api/2.0/public/mwl';
var nrdbDeckURL = 'https://netrunnerdb.com/api/2.0/public/decklist/';
var nrdbDeckDisplayURL = 'https://netrunnerdb.com/en/decklist/';
var nrdbCardDisplayURL = 'https://netrunnerdb.com/en/card/';
var updateTime = process.env.UPDATE_TIME;
var cards = {};
var fuzzySearch;
var scheduledUpdate;
var loadPromise;
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
        request(nrdbDeckURL + id, function (error, response, body) {
            if (error || response.statusCode !== 200) {
                return reject(error);
            }
            var decklist = {cards: {}};
            var deck = JSON.parse(body).data[0];
            var promises = [];
            decklist.name = deck.name;
            decklist.url = nrdbDeckDisplayURL + id;
            decklist.creator = deck.user_name;
            Object.keys(deck.cards).forEach((code) => {
                promises.push(createDecklistCard(code, deck.cards[code]));
            });
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
        loadPromise.then(function () {
            if (cards[code]) {
                resolve(cards[code]);
            } else {
                reject();
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
                    getCardByCode(results[0].value.code).then(resolve, reject);
                }else{
                    // Fall back to an acronym search.
                    var acronym = new RegExp(text.replace(/\W/g, '').replace(/(.)/g, '\\b$1.*?'), 'i');
                    var result = cardArray.find(function (e) {
                        return e.title.match(acronym);
                    });
                    if (results) {
                        getCardByCode(result.code).then(resolve, reject);
                    } else {
                        resolve(undefined);
                    }
                }
            });
        }
    });
}

// Initialise the local card array
function init (cardArray) {
    // Initialised as a promise so requests can be queued while the db is downloading.
    loadPromise = new Promise (function (resolve, reject) {
        if (cardArray) {
            console.log('Used passed card DB');
            resolve(cardArray);
        } else {
            // Load the json data from netrunnerdb.
            request(nrdbCardURL, function (error, response, body) {
                if (error || response.statusCode !== 200) {
                    console.error('Failed to fetch card DB: status', response.statusCode);
                    reject (error);
                } else {
                    cardArray = JSON.parse(body).data;
                    // Cancel any other updates as only the newest is necessary.
                    if (scheduledUpdate) {
                        scheduledUpdate.cancel();
                    }
                    console.log('Fetched card DB');
                    // Schedule the init method to be called again at the next midnight (NZ time)
                    var date = new Date();
                    if (date.getUTCHours() >= updateTime) {
                        date.setDate(date.getDate() + 1);
                    }
                    date.setUTCHours(updateTime);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                    console.log('Scheduling DB update for ' + date.toUTCString());
                    scheduledUpdate = schedule.scheduleJob(date, init);
                    resolve(cardArray);
                }
            });
        }
    });
    // Create a new promise for the most-wanted-list
    var mwlPromise = new Promise ((resolve, reject) => {
        loadPromise.then(() => {
            // Fetch the Most Wanted List from the NetrunnerDB API
            request(nrdbMWLURL, (error, response, body) => {
                if (error || response.statusCode !== 200) {
                    console.error('Failed to fetch Most Wanted List: status', response.statusCode);
                    reject (error);
                } else {
                    // The nrdb api provides several possible MWL rules, choose the latest official one.
                    var rulesets = JSON.parse(body).data;
                    var latest = {name: "Empty List", start: "1970-01-01", cards: {}};
                    rulesets.forEach((rule) => {
                        if (rule.active) {
                            latest = rule;
                        }
                    });
                    console.log('Using Most Wanted List: ', latest.name);
                    resolve (latest.cards);
                }
            });
        });
    });
    // Create another promise for the search indexing of the db so that title searches can be queued.
    indexPromise = new Promise ((resolve, reject) => {
        Promise.all([loadPromise, mwlPromise]).then((results) => {
            var cardArray = results[0];
            var liteArray = [];
            var mwl = results[1];
            cardArray.forEach((card) => {
                var liteCard = {
                    title: card.title,
                    text: card.text,
                    code: card.code,
                    uniqueness: card.uniqueness,
                    side: card.side_code,
                    faction: card.faction_code,
                    type: card.type_code.replace(/^(ice|[a-z])/, (c) => {return c.toUpperCase();}),
                    subtype: card.keywords,
                    factioncost: card.faction_cost,
                    baselink: card.base_link,
                    cost: card.cost,
                    memoryunits: card.memory_cost,
                    strength: card.strength,
                    trash: card.trash_cost,
                    advancementcost: card.advancement_cost,
                    minimumdecksize: card.minimum_deck_size,
                    influencelimit: card.influence_limit,
                    agendapoints: card.agenda_points,
                    url: nrdbCardDisplayURL + card.code
                }
                // Add a mwl flag to each card on the Most Wanted List.
                if(mwl[card.code]) {
                    liteCard.mwl = mwl[card.code];
                }
                // Add the card to the card sparse array for quick lookup.
                cards[card.code] = liteCard;
                liteArray.push({title: card.title, code: card.code});
            });
            // Index the CardArray.
            fuzzySearch = new FuzzySearch(liteArray, {
                'caseSensitive': false,
                'termPath': 'title',
                'minimumScore': 200
            });
            fuzzySearch.addModule(IndexOfFS({'minTermLength': 3, 'maxIterations': 500, 'factor': 2}));
            // fuzzySearch.addModule(SiftFS({'maxDistanceTolerance': 4, 'factor': 1}));
            fuzzySearch.addModule(LevenshteinFS({'maxDistanceTolerance': 4, 'factor': 1}));
            console.log('Cards indexed');
            resolve(liteArray);
        }, (error) => {
            reject (error);
        });
    });
    return indexPromise;
}
