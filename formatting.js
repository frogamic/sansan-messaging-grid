'use strict';
var colours = require('./colours.json');
var packs = require('./datapacks.json');

var thumbsURL = process.env.THUMBS_URL;
var messages = {
    noCardHits: [
        "The run was successful but you didn't access _\u200b[cards]\u200b_.",
        "I was unable to find _\u200b[cards]\u200b_ in any of my remotes.",
        "Despite 822 Medium counters, _\u200b[cards]\u200b_ wasn't found.",
        "The Near-Earth Hub couldn't locate _\u200b[cards]\u200b_."
    ],
    noDeckHits: [
        "The archetype of that deck would be _\u200bnon-existant\u200b_."
    ],
    helpBrackets:
        `Search for a card by (partial) name, or acronym, or a decklist by its netrunnerdb link e.g.\
\`\`\`[sneakdoor] [hiemdal] [etf]
[netrunnerdb\u200b.com/en/decklist/17055/example]\`\`\``,
    helpDeck:
        `Search for a decklist by its netrunnerdb link or ID number e.g.\
\`\`\`[command] 12345, [command] netrunnerdb\u200b.com/en/decklist/17055/example\`\`\``,
    helpCard:
        `Search for a card by (partial) name, approximation or acronym e.g.\
\`\`\`[command]sneakdoor, [command]hiemdal, [command]etf\`\`\``
};
var headings = [
    ['Event', 'Hardware', 'Resource', 'Agenda', 'Asset', 'Upgrade', 'Operation'],
    ['Icebreaker', 'Program', 'Barrier', 'Code Gate', 'Sentry', 'Multi', 'Other']
];
var stats = [
    ['baselink', ' :_link:'],
    ['cost', ':_credit:'],
    ['memoryunits', ' :_mu:'],
    ['strength', ' str'],
    ['trash', ' :_trash:'],
    ['advancementcost', ' :_advance:'],
    ['minimumdecksize', ' :_deck:'],
    ['influencelimit', '•'],
    ['agendapoints', ' :_agenda:']
];

function influenceDots(influence) {
    return '•'.repeat(influence);
}

function getPack(code) {
    var cycle = packs[Math.floor(code/1000)];
    if (Array.isArray(cycle)) {
        cycle = cycle[Math.floor(((code % 1000) - 1) / 20)];
    }
    return '_\u200b' + cycle + '\u200b_';
}

function formatLink(text, url) {
    return '<' + url + '|' + text + '>';
}

function getFactionEmoji(faction) {
    return ':_' + faction.replace(/\s.*/, '').toLowerCase() + ':';
}

function getCardNoHitsMessage(text) {
    var r = Math.floor(Math.random() * messages.noCardHits.length);
    return messages.noCardHits[r].replace(/\[cards\]/g, text);
}

exports.cardHelpMessage = (command) => {
    if (command) {
        return {
            text: messages.helpCard.replace(/\[command\]/g, command + ' ')
        };
    }
    return {
        text: messages.helpBrackets
    };
};

exports.deckHelpMessage = (command) => {
    return {
        text: messages.helpDeck.replace(/\[command\]/g, command)
    };
};

exports.cardNoHitsMessage = (cards) => {
    var text;
    if (cards.length > 2) {
        text = cards.slice(0, cards.length - 1).join(', ');
        text += ' or ' + cards[cards.length - 1];
    } else if (cards.length === 2) {
        text = cards.join(' or ');
    } else {
        text = cards[0];
    }
    var message = getCardNoHitsMessage(text);
    return {
        text: message
    };
};

exports.deckNoHitsMessage = () => {
    var r = Math.floor(Math.random() * messages.noDeckHits.length);
    return {
        text: messages.noDeckHits[r]
    };
};

exports.formatTitle = (title, url) => {
    title = '*\u200b' + title + '\u200b*';
    if (url && url !== '') {
        return formatLink(title, url);
    }
    return title;
};

exports.formatDecklist = (decklist) => {
    var o = {text: '', attachments:[{mrkdwn_in: ['pretext', 'fields']}]};
    var faction = decklist.cards.Identity[0].card.faction;
    var usedInfluence = 0;
    var decksize = 0;
    var agendapoints = 0;
    var fields = [];
    var newestCard = parseInt(decklist.cards.Identity[0].card.code);
    o.text = exports.formatTitle(decklist.name, decklist.url);
    o.text += ' - _\u200b' + decklist.creator + '\u200b_';
    for (let f in headings) {
        fields[f] = {title: '', value: '', short: true};
        for (let t in headings[f]) {
            var type = headings[f][t];
            if (decklist.cards[type]) {
                if (t) {
                    fields[f].value += '\n\n';
                }
                fields[f].value += exports.formatTitle(type);
                for (let i in decklist.cards[type]) {
                    var card = decklist.cards[type][i];
                    var code = parseInt(card.card.code);
                    fields[f].value += '\n' + card.quantity;
                    fields[f].value += ' × ' + formatLink(card.card.title, card.card.url);
                    decksize += card.quantity;
                    if (code > newestCard) {
                        newestCard = code;
                    }
                    if (card.card.agendapoints) {
                        agendapoints += card.card.agendapoints * card.quantity;
                    }
                    if (card.card.faction !== faction) {
                        var inf = card.quantity * card.card.factioncost;
                        fields[f].value += ' ' + influenceDots(inf);
                        usedInfluence += inf;
                    }
                }
            }
        }
    }
    o.attachments[0].color = colours[faction];
    o.attachments[0].fields = fields;
    o.attachments[0].pretext = formatLink(decklist.cards.Identity[0].card.title,
            decklist.cards.Identity[0].card.url);
    o.attachments[0].pretext += '\n' + decksize + ' :_deck: (min ';
    o.attachments[0].pretext +=  decklist.cards.Identity[0].card.minimumdecksize;
    o.attachments[0].pretext += ') - ' + usedInfluence + '/';
    o.attachments[0].pretext += (decklist.cards.Identity[0].card.influencelimit || '∞') + '•';
    if (decklist.cards.Identity[0].card.side !== 'Runner') {
        o.attachments[0].pretext += ' - ' + agendapoints + ' :_agenda:';
    }
    o.attachments[0].pretext += '\nCards up to ' + getPack(newestCard);
    return o;
};

exports.formatCards = (cards, missing) => {
    var o;
    if (missing && missing.length > 0) {
        o = exports.cardNoHitsMessage(missing);
        o.attachments = [];
    } else {
        o = {text:'', attachments:[]};
    }
    for (var i = 0; i < cards.length; i++) {
        var a = {pretext: '', mrkdwn_in: ['pretext', 'text']};
        var faction = cards[i].faction;
        var title = cards[i].title;
        if (cards[i].uniqueness){
            title = '◆ ' + title;
        }
        if (o.text === '') {
            o.text = exports.formatTitle(title, cards[0].url);
        } else {
            a.pretext = exports.formatTitle(title, cards[i].url) + '\n';
        }
        a.pretext += '*\u200b' + cards[i].type;
        if (cards[i].subtype ) {
            a.pretext += ':\u200b* ' + cards[i].subtype;
        } else {
            a.pretext += '\u200b*';
        }
        a.pretext += ' - ' + getFactionEmoji(faction);
        if (cards[i].factioncost) {
            a.pretext += influenceDots(cards[i].factioncost);
        }
        a.pretext += '\n';
        var first = true;
        if (cards[i].type === 'Asset' || cards[i].type === 'Upgrade' || cards[i].type === 'ICE') {
            stats[1][1] = ' :_rez:';
        } else {
            stats[1][1] = ':_credit:';
        }
        for (var j = 0; j < stats.length; j++) {
            if (cards[i][stats[j][0]] || cards[i][stats[j][0]] === 0) {
                if (!first) {
                    a.pretext += ' - ';
                }

                a.pretext += cards[i][stats[j][0]] + stats[j][1];
                first = false;
            } else if (cards[i].type === 'Identity' && stats[j][0] === 'influencelimit' && !cards[i].influencelimit) {
                a.pretext += ' - ∞•';
            }
        }
        a.pretext = a.pretext.replace(/(\d|X)\s*:_mu:/gi, function (x) {
            return x.replace(/(.).*/, ':_$1mu:').toLowerCase();
        });
        a.pretext += ' - ' + getPack(parseInt(cards[i].code));
        a.color = colours[faction];
        if (cards[i].text) {
            a.text = exports.formatText(cards[i].text);
        }
        a.thumb_url = thumbsURL + cards[i].code + '.png';
        o.attachments.push(a);
    }
    return o;
};

exports.formatText = (text) => {
    if (!text) return text;

    text = text.replace(/\r\n/g, '\n');

    text = text.replace(/\[Credits\]/g, ':_credit:');
    text = text.replace(/\[Recurring\ Credits\]/g, ':_recurringcredit:');
    text = text.replace(/\[Click\]/g, ':_click:');
    text = text.replace(/\ *\[Link\]/g, ' :_link:');
    text = text.replace(/\[Trash\]/g, ':_trash:');
    text = text.replace(/\[Subroutine\]/g, ':_subroutine:');
    text = text.replace(/(\d|X)\s*\[Memory\ Unit\]/gi, function (x) {
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
};

