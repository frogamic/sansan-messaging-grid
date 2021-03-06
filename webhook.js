/* webhook.js
 * Written by Dominic Shelton.
 * An Express based app that listens for queries from a Slack channel and responds with netrunnerdb card info.
 */
'use strict';
var express = require('express');
var bodyParser = require('body-parser');

var nrdb = require('./nrdb-local');
var formatting = require('./formatting');
// A list of common card shorthands and their corresponding full names
var shorthands = require('./shorthands.json');
// Regex generated from the shorthand keys to be used in find/replace
// Only matches whole words
var shorthandRegExp = new RegExp(
    Object.keys(shorthands).reduce((pv, cv, ci, a) => {
        var o = pv;
        if (ci !== 0) {
            o += '\\b|\\b';
        }
        o += cv;
        if (ci === a.length - 1) {
            o += '\\b';
        }
        return o;
    }, '\\b')
);

var port = process.env.PORT || 3000;
var token = process.env.TOKEN || '';
var authorizedDomains = process.env.AUTHORIZED_DOMAINS || undefined;
if (authorizedDomains) {
    authorizedDomains = authorizedDomains.toLowerCase().split(',');
}

// Find all search strings enclosed in square brackets in the given text.
function findSearchStrings(text) {
    var cardFinder = new RegExp('.*?\\[(.*?)\\]', 'g'),
        searches = [],
        i = cardFinder.exec(text);
    while (i) {
        searches.push(i[1]);
        i = cardFinder.exec(text);
    }
    return searches;
}

// Search the db for the specified cards
function findCards(searches) {
    // Create an array of promises, 1 for each card searched.
    var promises = [];
    searches.forEach((search, i) => {
        // Clean the search and expand any shorthands.
        var cleanSearch = search.toLowerCase().replace(shorthandRegExp, (sh) => {
            return shorthands[sh];
        });
        promises[i] = nrdb.getCardByTitle(cleanSearch);
    });
    return new Promise((resolve, reject) => {
        Promise.all(promises).then((cards) => {
            var hits = [];
            var misses = [];
            // Iterate through the cards returned by the searches, appending them to the hits or misses array.
            cards.forEach((card, i) => {
                if (card) {
                    hits.push(card);
                } else {
                    misses.push(searches[i]);
                }
            });
            resolve({hits, misses});
        }, reject);
    });
}

var app = express();

var domainWhitelist = express.Router().use((req, res, next) => {
    // Ensure the requester is on the authorized list
    var teamDomain = req.body.team_domain || "";
    teamDomain = teamDomain.toLowerCase();
    if (authorizedDomains && authorizedDomains.indexOf(teamDomain) === -1) {
        return res.json(formatting.unauthorizedMessage());
    }
    next();
});

// Intercept requests and perform several checks before serving
var requestValidator = express.Router().use((req, res, next) => {
    // Reject queries with empty bodies.
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    // Ignore automated slackbot messages.
    if (req.body.user_name === 'slackbot') {
        return res.send('');
    }
    next();
});

// Send empty response if the index isn't ready.
var loadedCheck = express.Router().use((req, res, next) => {
    // TODO Put a nice message here instead
    if (nrdbLoaded) {
        next();
    } else {
        return res.send('');
    }
});


var nrdbLoaded = false;
var nrdbLoadFailed = false;

nrdb.init().then(() => {
    nrdbLoaded = true;
}, () => {
    nrdbLoadFailed = true;
});

// Load middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(domainWhitelist);
app.use(requestValidator);
app.use(loadedCheck);

// Listen on the /decklist url for decklist requests.
app.post('/decklist', (req, res) => {
    // Get the decklist url from the query text.
    var match = req.body.text.match(/(\d+)/);
    if (match) {
        var id = match[1];
        nrdb.getDecklist(id).then((decklist) => {
            // The decklist was found
            return res.json(formatting.formatDecklist(decklist));
        }, () => {
            // The decklist wasn't found
            return res.json(formatting.deckNoHitsMessage());
        });
    } else {
        // Search was invalid, display help
        if (req.body.trigger_word) {
            return res.json(formatting.deckHelpMessage(req.body.trigger_word));
        } else {
            return res.json(formatting.deckHelpMessage(req.body.command));
        }
    }
});

app.post('/', (req, res) => {
    var helpResponse = formatting.cardHelpMessage();
    var searches = [];
    // slash-commands have commands
    if (req.body.command) {
        searches.push(req.body.text);
        helpResponse = formatting.cardHelpMessage(req.body.command);
    // other public commands have triggers
    } else if (req.body.trigger_word) {
        // Remove the trigger word and any whitespace from the start of the text
        searches.push(req.body.text.replace(new RegExp('^' + req.body.trigger_word + '\\s*', 'i'), ''));
        helpResponse = formatting.cardHelpMessage(req.body.trigger_word);
    } else {
        // Otherwise look for strings enclosed in square brackets.
        searches = findSearchStrings(req.body.text);
    }
    if (searches.length > 0) {
        // Respond to a call for help.
        if (searches[0].toLowerCase() === "help" && searches.length === 1) {
            return res.json(helpResponse);
        }
        // Check if the search appears to be a decklist
        var deckMatch = searches[0].match(/(decklist|deck\/view)\/(\d+)/);
        if (deckMatch) {
            var privateDeck = (deckMatch[1].toLowerCase() === 'deck/view');
            var id = deckMatch[2];
            nrdb.getDecklist(id, privateDeck).then((decklist) => {
                return res.json(formatting.formatDecklist(decklist));
            }, () => {
                return res.json(formatting.deckNoHitsMessage());
            });
        } else {
            findCards(searches).then((results) => {
                var o = formatting.formatCards(results.hits, results.misses);
                if (o.text !== '') {
                    return res.json(o);
                }
            }, (err) => {
                console.log(err);
                return res.sendStatus(500);
            });
        }
    } else {
        // If the message wasn't a search, send an empty reply.
        return res.send('');
    }
});

app.listen(port);
console.info('Express listening on port ' + port);

module.exports = {app: app, findSearchStrings: findSearchStrings, findCards: findCards};

