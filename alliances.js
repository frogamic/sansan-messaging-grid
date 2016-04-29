/* alliances.js
 * Written by Dominic Shelton.
 * Provides a number of functions for calculating the influence cost of alliance cards in decks.
 */
'use strict';

module.exports = {
    10013 : nonAllianceCards.bind(undefined, "Jinteki", 6),
    10018 : mumbaTemple,
    10019 : undefined,
    10029 : nonAllianceCards.bind(undefined, "Haas-Bioroid", 6),
    10038 : undefined,
    10067 : nonAllianceCards.bind(undefined, "Haas-Bioroid", 6),
    10068 : nonAllianceCards.bind(undefined, "Jinteki", 6),
    10071 : nonAllianceCards.bind(undefined, "NBN", 6),
    10072 : nonAllianceCards.bind(undefined, "Weyland Consortium", 6),
    10076 : undefined,
    10109 : nonAllianceCards.bind(undefined, "NBN", 6)
};

function nonAllianceCards (faction, minCards, decklist) {
    var factionCards = 0;
    Object.keys(decklist.cards).forEach((type) => {
        decklist.cards[type].forEach((card) => {
            if (card.card.faction == faction && (!card.card.subtype || card.card.subtype.indexOf("Alliance") == -1)) {
                factionCards += card.quantity;

            }
        });
    });
    if (factionCards >= minCards) {
        return 0;
    } else {
        return 1;
    }
};

function mumbaTemple (decklist) {
    var ice = 0;
    ["Barrier", "Code Gate", "Sentry", "Other", "Multi"].forEach((type) => {
        if (decklist.cards[type]) {
            decklist.cards[type].forEach((card) => {
                ice += card.quantity;
            });
        }
    });
    if (ice <= 15) {
        return 0;
    } else {
        return 1;
    }
}

