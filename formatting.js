var colours = require('./colours.json');

var stats = [
    ['baselink', ':link:'],
    ['cost', ':credit:'],
    ['strength', ' str'],
    ['trash', ':trash:'],
    ['memoryunits', ':mu:'],
    ['agendapoints', ':agenda:']
];

exports.formatCards = (cards) => {
    var o = {text:'', attachments:[]};
    for (var i = 0; i < cards.length; i++) {
        var a = {pretext: '', mrkdwn_in: ['text', 'pretext']};
        var faction = cards[i].faction.replace(/(\s|-).*/, '').toLowerCase();
        if (i === 0) {
            o.text = this.formatTitle(cards[0].title, cards[0].url);
        } else {
            a.pretext = this.formatTitle(cards[i].title, cards[i].url) + '\n';
        }
        a.pretext += '*\u200b' + cards[i].type + '\u200b*';
        if (cards[i].subtype ) {
            a.pretext += ' - ' + cards[i].subtype;
        }
        a.pretext += ' - :' + faction + ':';
        if (cards[i].factioncost) {
            for (var j = 0; j < cards[i].factioncost; j++) {
                a.pretext += '•';
            }
        }
        a.pretext += '\n';
        var first = true;
        if (cards[i].type === 'Agenda') {
            a.pretext += cards[i].advancementcost + '/';
        }
        if (cards[i].type === 'Identity') {
            a.pretext += cards[i].minimumdecksize + '/';
            if (cards[i].influencelimit || cards[i].influencelimit === 0) {
                a.pretext += cards[i].influencelimit;
            } else {
                a.pretext += '∞';
            }
            first = false;
        }
        for (j = 0; j < stats.length; j++) {
            if (cards[i][stats[j][0]] || cards[i][stats[j][0]] === 0) {
                if (!first) {
                    a.pretext += ' - ';
                }
                a.pretext += cards[i][stats[j][0]] + stats[j][1];
                first = false;
            }
        }
        a.pretext = a.pretext.replace(/(\d|X):mu:/gi, function (x) {
            return x.replace(/(.).*/, ':$1mu:').toLowerCase();
        });
        a.color = colours[faction];
        a.text = this.formatText(cards[i].text);
        o.attachments.push(a);
    }
    return o;
}

exports.formatText = (text) => {
    if (!text) return text;

    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\.\s*(.*?):/g, '.\n$1:');

    text = text.replace(/\[Credits\]/g, ':credit:');
    text = text.replace(/\[Recurring Credits\]/g, ':recurring-credit:');
    text = text.replace(/\[Click\]/g, ':click:');
    text = text.replace(/\[Link\]/g, ':link:');
    text = text.replace(/\[Trash\]/g, ':trash:');
    text = text.replace(/\.\s*\[Subroutine\]/g, '.\n:Subroutine:');
    text = text.replace(/\[Subroutine\]/g, ':subroutine:');
    text = text.replace(/(\d|X)\[Memory Unit\]/gi, function (x) {
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

exports.formatTitle = (title, url) => {
    title = '*\u200b' + title.replace('♦', '◆') + '\u200b*';
    if (url && url !== '') {
        return '<' + url + '|' + title + '>';
    }
    return title;
}

