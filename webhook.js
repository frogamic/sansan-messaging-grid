var express = require('express');

var port = process.env.PORT || 3000;

var app = express();

app.post('/', function (req, res) {
    res.json({text:'Hello World'});
});

app.listen(port);
console.info('Listening on port ' + port);

