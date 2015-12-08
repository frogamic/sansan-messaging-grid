var express = require('express');

var app = express();

app.post('/', function (req, res) {
    res.json({text:"Hello World"});
});

