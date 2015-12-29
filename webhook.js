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

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

var initpromise = nrdb.init();

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

function findCards(searches) {
    var promises = [], i;
    searches.forEach((search, i) => {
        promises[i] = nrdb.getCardByTitle(search);
    });
    return new Promise((resolve, reject) => {
        Promise.all(promises).then((cards) => {
            var hits = [];
            var misses = [];
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

app.post('/decklist', (req, res) => {
    // if (!req.body.token || req.body.token !== token) {
    //     return res.sendStatus(401);
    // }
    var helpResponse;
    if (req.body.trigger_word) {
        req.body.text = req.body.text.replace(new RegExp('^' + req.body.trigger_word + '\\s*', 'i'), '');
        helpResponse = formatting.deckHelpMessage(req.body.trigger_word);
    } else {
        helpResponse = formatting.deckHelpMessage(req.body.command);
    }
    var match = req.body.text.match(/(\d+)/);
    if (match) {
        var id = match[1];
        nrdb.getDecklist(id).then((decklist) => {
            res.json(formatting.formatDecklist(decklist));
        }, () => {
            res.json(formatting.deckNoHitsMessage());
        });
    } else {
        res.json(helpResponse);
    }
});

app.post('/', (req, res) => {
    // if (!req.body.token || req.body.token !== token) {
    //     return res.sendStatus(401);
    // }
    var helpResponse = formatting.cardHelpMessage();
    var searches = [];
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    if (req.body.user_name === 'slackbot') {
        return res.send('');
    }

    if (req.body.command) {
        searches[0] = req.body.text;
        helpResponse = formatting.cardHelpMessage(req.body.command);
    } else if (req.body.trigger_word) {
        searches[0] = req.body.text.replace(new RegExp('^' + req.body.trigger_word + '\\s*', 'i'), '');
        helpResponse = formatting.cardHelpMessage(req.body.trigger_word);
    } else {
        searches = findSearchStrings(req.body.text);
    }
    if (searches && searches.length > 0) {
        if (searches[0].toLowerCase() === "help" && searches.length === 1) {
            return res.json(helpResponse);
        }
        var match = searches[0].match(/(?:netrunnerdb.com\/\w\w\/decklist\/)(\d+)/);
        if (match) {
            var id = match[1];
            nrdb.getDecklist(id).then((decklist) => {
                res.json(formatting.formatDecklist(decklist));
            }, () => {
                res.json(formatting.deckNoHitsMessage());
            });
        } else {
            searches.forEach((search, i) => {
                searches[i] = search.toLowerCase().replace(shorthandRegExp, (sh) => {
                    return shorthands[sh];
                });
            });
            initpromise.then(() => {
                findCards(searches).then((results) => {
                    var o = formatting.formatCards(results.hits, results.misses);
                    if (o.text !== '') {
                        res.json(o);
                    } else {
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
        res.send('');
    }
});

app.listen(port);
console.info('Express listening on port ' + port);

module.exports = {app: app, findSearchStrings: findSearchStrings, findCards: findCards};

