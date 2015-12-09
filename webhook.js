var express = require('express');

var port = process.env.PORT || 3000;

var app = express();

var cardFinder = new RegExp('.*?\\[(.*?)\\]', 'g');

function formatText (text) {
    text = text.replace(/\.\s*(.*?):/g, '.\n$1:');

    text = text.replace(/\[Credits\]/g, ':credit:');
    text = text.replace(/\[Recurring Credits\]/g, ':recurring-credit:');
    text = text.replace(/\[Click\]/g, ':click:');
    text = text.replace(/\[Link\]/g, ':link:');
    text = text.replace(/\[Trash\]/g, ':trash:');
    text = text.replace(/\.\s*\[Subroutine\]/g, '.\n:Subroutine:');
    text = text.replace(/\[Subroutine\]/g, ':subroutine:');
    text = text.replace(/([1-4X])\[Memory Unit\]/gi, function (x) {
        return x.replace(/(.).*/, ':$1mu:').toLowerCase();
    });
    text = text.replace(/\[Memory Unit\]/g, ':mu:');

    text = text.replace(/<strong>/g, '*\u200b');
    text = text.replace(/<\/strong>/g, '\u200b*');
    text = text.replace(/<sup>(?:\d|X)+<\/sup>/gi, function(x){
        x = x.replace(/<sup>|<\/sup>/g, '');
        x = x.replace(/X/i,'ˣ');
        x = x.replace(/\d/g, function(d){
            return ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹'][parseInt(d)];
        });
        return x;
    });


    return text;
}

function formatTitle (title, url) {
    title = '*\u200b' + title + '\u200b*';
    if (url && url !== '') {
        return '<' + url + '|' + title + '>';
    }
    return title;
}

app.post('/', function (req, res) {
    res.json({text:'Hello World'});
});

app.listen(port);
console.info('Express listening on port ' + port);

module.exports = {app: app, formatText: formatText, formatTitle: formatTitle};

