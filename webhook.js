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

var messages = {
    noCardHits: "The run is successful but you access 0 cards of that name.",
    noDeckHits: "The archetype of that deck is _\u200bnon-existant\u200b_.",
    helpDeck: "Search for a decklist by it's netrunnerdb link or ID number.\ne.g. [command] _\u200bnetrunnerdb\u200b.com/en/decklist/\u200b_\u200b*\u200b12345\u200b*\u200b_\u200b/psycoscorch\u200b_",
    helpCard: "Search for a card by (partial) name, approximation or acronym\ne.g. [command] hiemdal, [command] etf"
};
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
            resolve(cards.filter((e) => {
                return e;
            }));
        }, reject);
    });
}

app.post('/decklist', (req, res) => {
    // if (!req.body.token || req.body.token !== token) {
    //     return res.sendStatus(401);
    // }
    var helpResponse = {text: messages.helpDeck};
    if (req.body.trigger_word) {
        req.body.text = req.body.text.replace(new RegExp('^' + req.body.trigger_word + '\\s*', 'i'), '');
        helpResponse.text = helpResponse.text.replace(/\[command\]/g, req.body.trigger_word);
    } else {
        helpResponse.text = helpResponse.text.replace(/\[command\]/g, req.body.command);
    }
    var match = req.body.text.match(/(\d+)/);
    if (match) {
        var id = match[1];
        nrdb.getDecklist(id).then((decklist) => {
            res.json(formatting.formatDecklist(decklist));
        }, () => {
            res.json({text: messages.noDeckHits});
        });
    } else {
        res.json(helpResponse);
    }
});

app.post('/', (req, res) => {
    // if (!req.body.token || req.body.token !== token) {
    //     return res.sendStatus(401);
    // }
    var response = undefined;
    var helpResponse = {text: messages.helpCard};
    var searches = [];
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    if (req.body.user_name === 'slackbot') {
        return res.send('');
    }

    if (req.body.command) {
        searches[0] = req.body.text;
        response = {text: messages.noCardHits};
        helpResponse.text = helpResponse.text.replace(/\[command\]/g, req.body.command);
    } else if (req.body.trigger_word) {
        searches[0] = req.body.text.replace(new RegExp('^' + req.body.trigger_word + '\\s*', 'i'), '');
        response = {text: messages.noCardHits};
        helpResponse.text = helpResponse.text.replace(/\[command\]/g, req.body.trigger_word);
    } else {
        searches = findSearchStrings(req.body.text);
    }
    if (searches && searches.length > 0) {
        if (searches[0].toLowerCase() === "help" && response) {
            return res.json(helpResponse);
        }
        var match = searches[0].match(/(?:netrunnerdb.com\/\w\w\/decklist\/)(\d+)/);
        if (match) {
            var id = match[1];
            nrdb.getDecklist(id).then((decklist) => {
                res.json(formatting.formatDecklist(decklist));
            }, () => {
                res.send({text: messages.noDeckHits});
            });
        } else {
            searches.forEach((search, i) => {
                searches[i] = search.toLowerCase().replace(shorthandRegExp, (sh) => {
                    return shorthands[sh];
                });
            });
            initpromise.then(() => {
                findCards(searches).then((results) => {
                    var o = formatting.formatCards(results);
                    if (o.text !== '') {
                        res.json(o);
                    } else {
                        res.json(response);
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

