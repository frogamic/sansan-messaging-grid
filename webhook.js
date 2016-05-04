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
var unauthorizedMessage = {text: "Unauthorized access detected.\n:_subroutine: End the run.\n:_subroutine: End the run."};

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

var initpromise = nrdb.init();

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
        promises[i] = nrdb.getCardByTitle(search);
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
            resolve({hits: hits, misses: misses});
        }, reject);
    });
}

// Listen on the /decklist url for decklist requests.
app.post('/decklist', (req, res) => {
    if (!req.body.team_domain ||
            (authorizedDomains && authorizedDomains.indexOf(req.body.team_domain.toLowerCase()) === -1)) {
        return res.json(unauthorizedMessage);
    }
    // Get the decklist url from the query text.
    var match = req.body.text.match(/(\d+)/);
    if (match) {
        var id = match[1];
        nrdb.getDecklist(id).then((decklist) => {
            // The decklist was found
            res.json(formatting.formatDecklist(decklist));
        }, () => {
            // The decklist wasn't found
            res.json(formatting.deckNoHitsMessage());
        });
    } else {
        // Search was invalid, display help
        if (req.body.trigger_word) {
            res.json(formatting.deckHelpMessage(req.body.trigger_word));
        } else {
            res.json(formatting.deckHelpMessage(req.body.command));
        }
    }
});

app.post('/', (req, res) => {
    if (!req.body.team_domain ||
            (authorizedDomains && authorizedDomains.indexOf(req.body.team_domain.toLowerCase()) === -1)) {
        return res.json(unauthorizedMessage);
    }
    var helpResponse = formatting.cardHelpMessage();
    var searches = [];
    // Reject queries with empty bodies.
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    // Ignore automated slackbot messages.
    if (req.body.user_name === 'slackbot') {
        return res.send('');
    }

    // slash-commands have commands
    if (req.body.command) {
        searches[0] = req.body.text;
        helpResponse = formatting.cardHelpMessage(req.body.command);
    // other public commands have triggers
    } else if (req.body.trigger_word) {
        searches[0] = req.body.text.replace(new RegExp('^' + req.body.trigger_word + '\\s*', 'i'), '');
        helpResponse = formatting.cardHelpMessage(req.body.trigger_word);
    } else {
        // Otherwise look for strings enclosed in square brackets.
        searches = findSearchStrings(req.body.text);
    }
    if (searches && searches.length > 0) {
        // Respond to a call for help.
        if (searches[0].toLowerCase() === "help" && searches.length === 1) {
            return res.json(helpResponse);
        }
        // Check if the search appears to be a decklist
        var match = searches[0].match(/(?:netrunnerdb.com\/\w\w\/decklist\/)(\d+)/);
        if (match) {
            var id = match[1];
            nrdb.getDecklist(id).then((decklist) => {
                res.json(formatting.formatDecklist(decklist));
            }, () => {
                res.json(formatting.deckNoHitsMessage());
            });
        } else {
            // Clean the searches and expand any shorthands.
            searches.forEach((search, i) => {
                searches[i] = search.toLowerCase().replace(shorthandRegExp, (sh) => {
                    return shorthands[sh];
                });
            });
            // Once the card db is loaded...
            initpromise.then(() => {
                // ...search for the card(s)
                findCards(searches).then((results) => {
                    var o = formatting.formatCards(results.hits, results.misses);
                    if (o.text !== '') {
                        res.json(o);
                    } else {
                        // the formatter will return an empty object when nothing is found.
                        res.json(formatting.cardNoHitsMessage(searches));
                    }
                }, (err) => {
                    console.log(err);
                    res.sendStatus(500);
                });
            }, (err) => {
                console.log(err);
                res.sendStatus(500);
            });
        }
    } else {
        // If the message wasn't a search, send an empty reply.
        res.send('');
    }
});

app.listen(port);
console.info('Express listening on port ' + port);

module.exports = {app: app, findSearchStrings: findSearchStrings, findCards: findCards};

