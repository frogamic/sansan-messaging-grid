var express = require('express');
var bodyParser = require('body-parser');

var nrdb = require('./nrdb-local');
var formatting = require('./formatting');

var port = process.env.PORT || 3000;

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

function findSearchStrings (text) {
    console.info(text);
    var cardFinder = new RegExp('.*?\\[(.*?)\\]', 'g');
    var searches = [];
    var i;
    while(i = cardFinder.exec(text)) {
        searches.push(i[1]);
    }
    console.info(searches);
    return searches;
}

app.post('/', function (req, res) {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    if (req.body.user_name === 'slackbot') {
        return res.sendStatus(200);
    }

    console.info(req.body);

    var searches = findSearchStrings(req.body.text);
    if (searches.length) {
        var cards = [];
        var p = nrdb.getCardByTitle(searches[0]);
        for (var i = 0; i < searches.length; i++) {
            p = p.then(function (card) {
                cards.push(card);
                return nrdb.getCardByTitle(searches[i]);
            });
        }
        p.then(function (card) {
            cards.push(card);
            res.json(formatting.formatCards(cards));
        }, function () {
            res.json(formatting.formatCards(cards));
        });
    } else {
        res.sendStatus(200);
    }
});

app.listen(port);
console.info('Express listening on port ' + port);

nrdb.init();

module.exports = {app: app, findSearchStrings: findSearchStrings};

