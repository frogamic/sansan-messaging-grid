'use strict';

module.exports = {cardHelpMessage, deckHelpMessage, cardNoHitsMessage, deckNoHitsMessage, formatTitle, formatDecklist, formatCards, formatText};

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
        "Search for a card by (partial) name, or acronym, or a decklist by its netrunnerdb link e.g.\`\`\`[sneakdoor] [hiemdal] [etf]\n[netrunnerdb\u200b.com/en/decklist/17055/example]\`\`\`",
    helpDeck:
        "Search for a decklist by its netrunnerdb link or ID number e.g.\`\`\`[command] 12345, [command] netrunnerdb\u200b.com/en/decklist/17055/example\`\`\`",
    helpCard:
        "Search for a card by (partial) name, approximation or acronym e.g.\`\`\`[command]sneakdoor, [command]hiemdal, [command]etf\`\`\`"
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

function cardHelpMessage(command) {
    if (command) {
        return {
            text: messages.helpCard.replace(/\[command\]/g, command + ' ')
        };
    }
    return {
        text: messages.helpBrackets
    };
};

function deckHelpMessage(command) {
    return {
        text: messages.helpDeck.replace(/\[command\]/g, command)
    };
};

// Generates a message indicating that cards weren't found, by concatenating the names with commas and 'or'
function cardNoHitsMessage(cards) {
    var text;
    if (cards.length >= 2) {
        text = cards.slice(0, cards.length - 1).join(', ');
        text += ' or ' + cards[cards.length - 1];
    } else {
        text = cards[0];
    }
    var message = getCardNoHitsMessage(text);
    return {
        text: message
    };
};

function deckNoHitsMessage() {
    var r = Math.floor(Math.random() * messages.noDeckHits.length);
    return {
        text: messages.noDeckHits[r]
    };
};

// Makes the title text bold and makes a link if requested
function formatTitle(title, url) {
    title = '*\u200b' + title + '\u200b*';
    if (url && url !== '') {
        return formatLink(title, url);
    }
    return title;
};

function formatDecklist(decklist) {
    // Initialise the return object.
    var o = {text: '', attachments:[{mrkdwn_in: ['pretext', 'fields']}]};
    var faction = decklist.cards.Identity[0].card.faction;
    var usedInfluence = 0;
    var decksize = 0;
    var agendapoints = 0;
    var fields = [];
    // Initialise the newestCard var to a card that is guaranteed to be in every deck.
    var newestCard = parseInt(decklist.cards.Identity[0].card.code);
    o.text = formatTitle(decklist.name, decklist.url);
    o.text += ' - _\u200b' + decklist.creator + '\u200b_';
    for (let column in headings) {
        // Create the columns as Slack 'fields'.
        fields[column] = {title: '', value: '', short: true};
        for (let heading in headings[column]) {
            var type = headings[column][heading];
            // Check if the deck actually contains cards of the specified heading
            if (decklist.cards[type]) {
                // If this is not the first heading, add padding after the previous.
                if (heading != 0) {
                    fields[column].value += '\n\n';
                }
                fields[column].value += formatTitle(type);
                // Iterate through all the cards of the type in the decklist.
                for (let i in decklist.cards[type]) {
                    var card = decklist.cards[type][i];
                    var code = parseInt(card.card.code);
                    fields[column].value += '\n' + card.quantity;
                    fields[column].value += ' × ' + formatLink(card.card.title, card.card.url);
                    decksize += card.quantity;
                    // Check that the card is not newer than the previous newest card.
                    if (code > newestCard) {
                        newestCard = code;
                    }
                    if (card.card.agendapoints) {
                        agendapoints += card.card.agendapoints * card.quantity;
                    }
                    // Add influence dots after the card name if required.
                    if (card.card.faction !== faction) {
                        var inf = card.quantity * card.card.factioncost;
                        fields[column].value += ' ' + influenceDots(inf);
                        usedInfluence += inf;
                    }
                }
            }
        }
    }
    o.attachments[0].color = colours[faction];
    o.attachments[0].fields = fields;
    // The identity of the decklist is displayed before the decklist.
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

function formatCards(cards, missing) {
    var o;
    // If there are cards that could not be found, tell the user.
    if (missing && missing.length > 0) {
        o = cardNoHitsMessage(missing);
        o.attachments = [];
    } else {
        o = {text:'', attachments:[]};
    }
    // Display the cards that were found either way.
    for (var i = 0; i < cards.length; i++) {
        var a = {pretext: '', mrkdwn_in: ['pretext', 'text']};
        var faction = cards[i].faction;
        var title = cards[i].title;
        if (cards[i].uniqueness){
            title = '◆ ' + title;
        }
        // If the Slack message is blank, put the title of the first card there.
        // The Slack API won't display messages with blank text even when there are attachments.
        if (o.text === '') {
            o.text = formatTitle(title, cards[0].url);
        } else {
            a.pretext = formatTitle(title, cards[i].url) + '\n';
        }
        // Append the rest of the card details to the attachment.
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
        // For some cards, the cost is actually a rez cost, this should be reflected in the emoji.
        if (cards[i].type === 'Asset' || cards[i].type === 'Upgrade' || cards[i].type === 'ICE') {
            stats[1][1] = ' :_rez:';
        } else {
            stats[1][1] = ':_credit:';
        }
        // Iterate through the possible card stats adding them to the text where present.
        for (var j = 0; j < stats.length; j++) {
            if (cards[i][stats[j][0]] || cards[i][stats[j][0]] === 0) {
                if (!first) {
                    a.pretext += ' - ';
                }
                a.pretext += cards[i][stats[j][0]] + stats[j][1];
                first = false;
            // Special case for draft IDs with infinite influence limit
            } else if (cards[i].type === 'Identity' && stats[j][0] === 'influencelimit' && !cards[i].influencelimit) {
                a.pretext += ' - ∞•';
            }
        }
        // Replace memory units with the slack emoji
        a.pretext = a.pretext.replace(/(\d|X)\s*:_mu:/gi, function (x) {
            return x.replace(/(.).*/, ':_$1mu:').toLowerCase();
        });
        a.pretext += ' - ' + getPack(parseInt(cards[i].code));
        a.color = colours[faction];
        // Add the card text to the attachment if present.
        if (cards[i].text) {
            a.text = formatText(cards[i].text);
        }
        a.thumb_url = thumbsURL + cards[i].code + '.png';
        o.attachments.push(a);
    }
    return o;
};

// Replace all the html and nrdb text with the Slack equivalent.
function formatText(text) {
    if (!text) return text;

    text = text.replace(/\r\n/g, '\n');

    // NRDB symbols to Slack emoji.
    text = text.replace(/\[Credits\]/g, ':_credit:');
    text = text.replace(/\[Recurring\ Credits\]/g, ':_recurringcredit:');
    text = text.replace(/\[Click\]/g, ':_click:');
    text = text.replace(/\ *\[Link\]/g, ' :_link:');
    text = text.replace(/\[Trash\]/g, ':_trash:');
    text = text.replace(/\[Subroutine\]/g, ':_subroutine:');
    // Individual mu emoji for numbers and 'Xmu'
    text = text.replace(/(\d|X)\s*\[Memory\ Unit\]/gi, function (x) {
        return x.replace(/(.).*/, ':_$1mu:').toLowerCase();
    });
    text = text.replace(/\[Memory Unit\]/g, ':_mu:');

    // HTML bold to Slack bold
    text = text.replace(/<strong>/g, '*\u200b');
    text = text.replace(/<\/strong>/g, '\u200b*');
    // HTML superscript to unicode superscript since Slack markdown doesn't support it.
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

