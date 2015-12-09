var express = require('express');
var bodyParser = require('body-parser');

var port = process.env.PORT || 3000;

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

function findSearchStrings (text) {
    var cardFinder = new RegExp('.*?\\[(.*?)\\]', 'g');
    var searches = [];
    var i;
    while(i = cardFinder.exec(text)) {
        searches.push(i[1]);
    }
    return searches;
}

app.post('/', function (req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }
    var searches = findSearchStrings(req.body.text);
    if (searches.length) {
        res.json({text:'Hello World'});
    } else {
        res.sendStatus(200);
    }
});

app.listen(port);
console.info('Express listening on port ' + port);

module.exports = {app: app, findSearchStrings: findSearchStrings};

