var colours = require('./colours.json');

var stats = [
    ['baselink', ':_link:'],
    ['cost', ':_credit:'],
    ['memoryunits', ':_mu:'],
    ['strength', ' str'],
    ['trash', ':_trash:'],
    ['advancementcost', ':_advance:'],
    ['agendapoints', ':_agenda:']
];

exports.formatCards = (cards) => {
    var o = {text:'', attachments:[]};
    for (var i = 0; i < cards.length; i++) {
        var a = {pretext: '', mrkdwn_in: ['pretext', 'text']};
        var faction = cards[i].faction.replace(/(\s|-).*/, '').toLowerCase();
        var title = cards[i].title;
        if (cards[i].uniqueness){
            title = '◆ ' + title;
        }
        if (i === 0) {
            o.text = this.formatTitle(title, cards[0].url);
        } else {
            a.pretext = this.formatTitle(title, cards[i].url) + '\n';
        }
        a.pretext += '*\u200b' + cards[i].type;
        if (cards[i].subtype ) {
            a.pretext += ':\u200b* ' + cards[i].subtype;
        } else {
            a.pretext += '\u200b*';
        }
        a.pretext += ' - :_' + faction + ':';
        if (cards[i].factioncost) {
            for (var j = 0; j < cards[i].factioncost; j++) {
                a.pretext += '•';
            }
        }
        a.pretext += '\n';
        var first = true;
        if (cards[i].type === 'Identity') {
            a.pretext += cards[i].minimumdecksize + '/';
            if (cards[i].influencelimit || cards[i].influencelimit === 0) {
                a.pretext += cards[i].influencelimit;
            } else {
                a.pretext += '∞';
            }
            first = false;
        }
        if (cards[i].type === 'Asset' || cards[i].type === 'Upgrade' || cards[i].type === 'ICE') {
            stats[1][1] = ':_rez:';
        } else {
            stats[1][1] = ':_credit:';
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
        a.pretext = a.pretext.replace(/(\d|X)\s*:_mu:/gi, function (x) {
            return x.replace(/(.).*/, ':_$1mu:').toLowerCase();
        });
        a.color = colours[faction];
        if (cards[i].text) {
            a.text = this.formatText(cards[i].text);
        }
        o.attachments.push(a);
    }
    return o;
}

exports.formatText = (text) => {
    if (!text) return text;

    text = text.replace(/\r\n/g, '\n');

    text = text.replace(/\[Credits\]/g, ':_credit:');
    text = text.replace(/\[Recurring Credits\]/g, ':_recurring-credit:');
    text = text.replace(/\[Click\]/g, ':_click:');
    text = text.replace(/\[Link\]/g, ':_link:');
    text = text.replace(/\[Trash\]/g, ':_trash:');
    text = text.replace(/\[Subroutine\]/g, ':_subroutine:');
    text = text.replace(/(\d|X)\s*\[Memory Unit\]/gi, function (x) {
        return x.replace(/(.).*/, ':_$1mu:').toLowerCase();
    });
    text = text.replace(/\[Memory Unit\]/g, ':_mu:');

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

    text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');

    return text;
}

exports.formatTitle = (title, url) => {
    title = '*\u200b' + title + '\u200b*';
    if (url && url !== '') {
        return '<' + url + '|' + title + '>';
    }
    return title;
}

