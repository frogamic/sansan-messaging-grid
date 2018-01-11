/**
 * Provides a number of functions for formatting text, cards and decks on Slack using the Slack API and Markdown.
 * @module  formating
 * @author  Dominic Shelton.
 */
'use strict';

/**
 * @var {object} colours
 * The faction colours are loaded from a JSON file.
 */
var colours = require('./colours.json');
/**
 * @var {string[]|string[][]} packs 
 * The pack and cycle names are loaded from a JSON file.
 */
var packs = require('./datapacks.json');
/**
 * @var {module} alliances
 * The {@link alliances} module is required for calculating the decklist influence total.
 */
var alliances = require('./alliances.js');
/**
 * @var {string} thumbsURL
 * The URL where the card thumbnails are hosted, loaded from the environment variable THUMBS_URL
 */
var thumbsURL = process.env.THUMBS_URL;
/**
 * @var {object}  messages
 * Various text messages conveniently combined into one object.
 */
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
        "Search for a card by (partial) name, approximation or acronym e.g.\`\`\`[command]sneakdoor, [command]hiemdal, [command]etf\`\`\`",
    unauthorized: "Unauthorized access detected.\n:_subroutine: End the run.\n:_subroutine: End the run.",
    unavailable:
        "The NetrunnerDB info is still being fetched, try again in a minute or two."
};

/**
 * @var {string[][]}    headings
 * Headings used in Decklists, in the order they appear in the decklist output.
 */
var headings = [
    ['Event', 'Hardware', 'Resource', 'Agenda', 'Asset', 'Upgrade', 'Operation'],
    ['Icebreaker', 'Program', 'Barrier', 'Code Gate', 'Sentry', 'Multi', 'Other']
];
/**
 * @var {string[][]}    stats
 * An array of pairs of card stats and corresponding emoji, in the order they should appear in card descriptions.
 */
var stats = [
    ['baselink', ' :_link:'],
    ['cost', ':_credit:'],
    ['rezcost', ':_rez:'],
    ['memoryunits', ' :_mu:'],
    ['strength', ' str'],
    ['trash', ' :_trash:'],
    ['advancementcost', ' :_advance:'],
    ['minimumdecksize', ' :_deck:'],
    ['influencelimit', '•'],
    ['agendapoints', ' :_agenda:']
];

/**
 * @func cardHelpMessage
 * @param   command {string}    The Slack command that was used to invoke the help request, used in the examples returned. Can be left blank to invoke the fallback brackets help text.
 * @return  {object}    A Slack API message object of a help response message.
 */
module.exports.cardHelpMessage = cardHelpMessage;
function cardHelpMessage(command) {
    if (command) {
        return {
            text: messages.helpCard.replace(/\[command\]/gi, command + ' ')
        };
    }
    return {
        text: messages.helpBrackets
    };
};

/**
 * @func deckHelpMessage
 * @param   command {string}    The Slack command that was used to invoke the help request, used in the examples returned.
 * @return  {object}    A Slack API message object of a help response message.
 */
module.exports.deckHelpMessage = deckHelpMessage;
function deckHelpMessage(command) {
    return {
        text: messages.helpDeck.replace(/\[command\]/gi, command)
    };
};

/**
 * Returns a message to the user that the nrdb database is not yet loaded
 * @return  {string}    A private message to the user stating that nrdb is not yet loaded
 */
module.exports.unauthorizedMessage = unauthorizedMessage;
function unauthorizedMessage() {
    return {
        "text": messages.unauthorized
    }
}

/**
 * Returns a message to the user that the nrdb database is not yet loaded
 * @return  {string}    A private message to the user stating that nrdb is not yet loaded
 */
module.exports.unavailableMessage = unavailableMessage;
function unavailableMessage() {
    return {
        "response_type": "ephemeral",
        "text": messages.unavailable
    }
}

/**
 * Generates a message indicating that cards weren't found, by concatenating the names with commas and 'or'
 * @func cardNoHitsMessage
 * @param   cards   {string[]}  An array of card titles that weren't found.
 * @return  {string}    A randomized Slack API message object stating that the given cards weren't found.
 */
module.exports.cardNoHitsMessage = cardNoHitsMessage;
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

/**
 * Generates a message indicating that a deck wasn't found.
 * @func deckNoHitsMessage
 * @return  {string}    A randomized Slack API message object stating that the deck wasn't found.
 */
module.exports.deckNoHitsMessage = deckNoHitsMessage;
function deckNoHitsMessage() {
    var r = Math.floor(Math.random() * messages.noDeckHits.length);
    return {
        text: messages.noDeckHits[r]
    };
};

/**
 * Applies Slack markdown formatting to the given title to bolden and optionally apply the link.
 * @func    formatTitle
 * @param   title   {string}    The text to display as the title.
 * @param   [url]   {string}    The URL to link the title to.
 * @return  {string}    A string containing the title with Slack markdown formatting applied.
 */
module.exports.formatTitle = formatTitle;
function formatTitle(title, url) {
    title = '*\u200b' + title + '\u200b*';
    if (url && url !== '') {
        return formatLink(title, url);
    }
    return title;
};

/**
 * @func    formatDecklist
 * @param   decklist    {object}    The decklist to be converted into a Slack message.
 * @return  {object}    A Slack API message object containing the decklist or an error message.
 */
module.exports.formatDecklist = (decklist) => {
    // Initialise the return object.
    var o = {text: '', attachments:[{mrkdwn_in: ['pretext', 'fields']}]};
    var faction = decklist.cards.Identity[0].card.faction;
    var usedInfluence = 0;
    var mwlDeduction = 0;
    var decksize = 0;
    var agendapoints = 0;
    var fields = [];
    // Initialise the newestCard var to a card that is guaranteed to be in every deck.
    var newestCard = parseInt(decklist.cards.Identity[0].card.code);
    o.text = formatTitle(decklist.name, decklist.url);
    if (decklist.privateDeck) {
        o.text += ' _\u200b(private)\u200b_';
    }
    o.text += ' - _\u200b' + decklist.creator + '\u200b_';
    for (let column in headings) {
        // Create the columns as Slack 'fields'.
        fields[column] = {title: '', value: '', short: true};
        for (let heading in headings[column]) {
            var type = headings[column][heading];
            // Check if the deck actually contains cards of the specified heading
            if (decklist.cards[type]) {
                var typeTotal = 0;
                var text = '';
                // Iterate through all the cards of the type in the decklist.
                for (let i in decklist.cards[type]) {
                    var card = decklist.cards[type][i];
                    var code = parseInt(card.card.code);
                    typeTotal += card.quantity;
                    text += '\n' + card.quantity;
                    text += ' × ' + formatLink(card.card.title, card.card.url);
                    decksize += card.quantity;
                    // Check that the card is not newer than the previous newest card.
                    if (code > newestCard) {
                        newestCard = code;
                    }
                    if (card.card.agendapoints) {
                        agendapoints += card.card.agendapoints * card.quantity;
                    }
                    // Add MWL star if required.
                    if (card.card.mwl)
                    {
                        var mwl = card.quantity * card.card.mwl;
                        text += ' ' + '☆'.repeat(mwl);
                        mwlDeduction += mwl;
                    }
                    // Add influence dots after the card name if required.
                    if (card.card.faction !== faction) {
                        var inf = card.quantity * card.card.factioncost;
                        if (alliances[card.card.code]) {
                            inf *= alliances[card.card.code](decklist);
                        }
                        text += ' ' + influenceDots(inf);
                        usedInfluence += inf;
                    }
                }
                // If this is not the first heading, add padding after the previous.
                if (heading != 0) {
                    fields[column].value += '\n\n';
                }
                fields[column].value += formatTitle(type) + ' (' + typeTotal + ')';
                fields[column].value += text;
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
    if (decklist.cards.Identity[0].card.influencelimit) {
        o.attachments[0].pretext += decklist.cards.Identity[0].card.influencelimit - mwlDeduction + '•';
        if (mwlDeduction > 0) {
            o.attachments[0].pretext += '(' + decklist.cards.Identity[0].card.influencelimit + '-';
            o.attachments[0].pretext += mwlDeduction + '☆)';
        }
    } else {
        o.attachments[0].pretext += '∞•';
    }
    if (decklist.cards.Identity[0].card.side !== 'runner') {
        o.attachments[0].pretext += ' - ' + agendapoints + ' :_agenda:';
    }
    o.attachments[0].pretext += '\nCards up to ' + getPack(newestCard);
    return o;
};

/**
 * @func    formatCards
 * @param   [cards] {object[]}  The cards to be converted into a Slack message.
 * @param   [cards] {object[]}  The cards that weren't found and should be mentioned in an error message.
 * @return  {object}    A Slack API Message object either containing the cards as attachments or containing an error message that the cards couldn't be found, or both.
 */
module.exports.formatCards = (cards, missing) => {
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
        if (cards[i].mwl) {
            a.pretext += '☆'.repeat(cards[i].mwl);
        }
        a.pretext += '\n';
        var first = true;
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

/**
 * Replace all the html and nrdb text with the Slack equivalent.
 * @func    formatText
 * @param   text    {string}    The body of text to convert to Slack formatting.
 * @return  {string}    The text, formatted in Slack markdown syntax.
 */
module.exports.formatText = formatText;
function formatText(text) {
    if (!text) return text;

    text = text.replace(/\r\n/g, '\n');

    // NRDB symbols to Slack emoji.
    text = text.replace(/\[credits?\]/gi, ':_credit:');
    text = text.replace(/\[recurring[\- ]credits?\]/gi, ':_recurringcredit:');
    text = text.replace(/\[click\]/gi, ':_click:');
    text = text.replace(/\ *\[link\]/gi, ' :_link:');
    text = text.replace(/\[trash\]/gi, ':_trash:');
    text = text.replace(/\[subroutine\]/gi, ':_subroutine:');
    // Individual mu emoji for numbers and 'Xmu'
    text = text.replace(/(\d|X)\s*\[(?:memory unit|mu)\]/gi, function (x) {
        return x.replace(/(.).*/, ':_$1mu:').toLowerCase();
    });
    text = text.replace(/\[(?:memory unit|mu)\]/gi, ':_mu:');

    // HTML bold to Slack bold
    text = text.replace(/<strong>/gi, '*\u200b');
    text = text.replace(/<\/strong>/gi, '\u200b*');

    // Errata tags
    text = text.replace(/<errata>/gi, ':_exclamation:\u200b_\u200b');
    text = text.replace(/<\/errata>/gi, '\u200b_');

    // Convert traces into unicode superscripts and format accordingly
    text = text.replace(/<trace>(trace)\s*(\d+|X)<\/trace>/gi, function (a, x, y){
        y = y.replace(/X/i,'ˣ');
        y = y.replace(/\d/g, function (d){
            return ['⁰','¹','²','³','⁴','⁵','⁶','⁷','⁸','⁹'][parseInt(d)];
        });
        return '*\u200b' + x + y + '\u200b*\u2013';
    });
    // Replace nrdb faction symbols with Slack emoji
    text = text.replace(/\[(jinteki|weyland-consortium|nbn|haas-bioroid|anarch|shaper|criminal)\]/, (a, x) => {
        return getFactionEmoji(x);
    });

    text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');

    return text;
};

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
    return ':_' + faction.replace(/[\s-].*/, '').toLowerCase() + ':';
}

function getCardNoHitsMessage(text) {
    var r = Math.floor(Math.random() * messages.noCardHits.length);
    return messages.noCardHits[r].replace(/\[cards\]/gi, text);
}

