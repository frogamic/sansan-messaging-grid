var express = require('express');
var bodyParser = require('body-parser');

var nrdb = require('./nrdb-local');
var formatting = require('./formatting');
// A list of common card shorthands and their corresponding full names
var shorthands = require('./shorthands.json');
// Regex generated from the shorthand keys to be used in find/replace
// Only matches whole words
var shorthandRegExp = new RegExp(
    Object.keys(shorthands).reduce(function (pv, cv, ci, a) {
        var o = pv;
        if (ci !== 0) {
            o += '\\b|\\b';
        }
        o += cv;
        if(ci == a.length-1) {
            o+='\\b';
        }
        return o;
    }, '\\b')
);

var port = process.env.PORT || 3000;
var triggerDecklist = process.env.TRIGGER_DECKLIST || 'decklist';
var triggerCard = process.env.TRIGGER_CARD || 'nrdb';

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

var initpromise = nrdb.init();

function findSearchStrings (text) {
    var cardFinder = new RegExp('.*?\\[(.*?)\\]', 'g');
    var searches = [];
    var i;
    while(i = cardFinder.exec(text)) {
        searches.push(i[1]);
    }
    return searches;
}

function findCards (searches) {
    var promises = [];
    for (var i = 0; i < searches.length; i++) {
        promises[i] = nrdb.getCardByTitle(searches[i]);
    }
    return new Promise(function (resolve, reject) {
        Promise.all(promises).then(function (cards) {
            resolve (cards.filter(function (e) {
                return e ? true : false;
            }));
        }, reject);
    });
}

app.post('/', function (req, res) {
    var searches = [];
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    if (req.body.user_name === 'slackbot') {
        return res.sendStatus(200);
    }

    if (req.body.command) {
        if (req.body.command === '/' + triggerCard) {
            searches[0] = req.body.text;
        }
    } else {
        var re = new RegExp('^' + triggerCard + ':\\s*', 'i');
        if (req.body.trigger_word.match(re)) {
            searches[0] = req.body.text.replace(re, '');
        } else {
            searches = findSearchStrings(req.body.text);
        }
    }
    if (searches && searches.length > 0) {
        for (i in searches) {
            searches[i] = searches[i].toLowerCase().replace(shorthandRegExp, function(sh){
                return shorthands[sh];
            });
        }
        initpromise.then(function () {
            findCards(searches).then (function (results) {
                res.json(formatting.formatCards(results));
            }, function (err) {
                console.log(err);
                res.sendStatus(500);
            });
        }, function(err) {
            console.log(err);
            res.sendStatus(500);
        });
    } else {
        res.send('');
    }
});

app.listen(port);
console.info('Express listening on port ' + port);

module.exports = {app: app, findSearchStrings: findSearchStrings, findCards: findCards};

