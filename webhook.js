var express = require('express');

var port = process.env.PORT || 3000;

var app = express();

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
    res.json({text:'Hello World'});
});

app.listen(port);
console.info('Express listening on port ' + port);

module.exports = {app: app, findSearchStrings: findSearchStrings};

