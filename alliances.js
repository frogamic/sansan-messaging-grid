/**
 * Exports functions for calculating the influence cost of alliance cards in decks. To check if a card's influence can be checked, you should check if the function with the card's NRDB code exists in this module.
 * @module alliances
 * @author Dominic Shelton.
 */
'use strict';

/**
 * The function for Heritage Committee is bound to nonAllianceCards with 6 Jinteki cards minimum.
 * @function 10013
 * @param   decklist    The decklist to check the influence cost in.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10013'] = nonAllianceCards.bind(undefined, "Jinteki", 6);

/**
 * Calculates a multiplier for the influence cost of Mumba Temple by counting the number of ICE in the deck.
 * @function 10018
 * @param   decklist    The decklist to calculate the influence for.
 * @return  0 if the influence cost is free, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10018'] = (decklist) => {
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

/**
 * Calculates a multiplier for the influence cost of Museum of History by counting the number of cards in the deck.
 * @function    10019
 * @param   decklist    The decklist to calculate the influence for.
 * @return  0 if the influence cost is free, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10019'] = (decklist) => {
    var totalCards = 0;
    Object.keys(decklist.cards).forEach((type) => {
        decklist.cards[type].forEach(card => {
            totalCards += card.quantity;
        });
    });
    // Minus 1 for the identity which doesn't count towards the total cards.
    totalCards -= 1;
    if (totalCards >= 50) {
        return 0;
    } else {
        return 1;
    }
}

/**
 * The function for Product Recall is bound to nonAllianceCards with 6 Haas-Bioroid cards minimum.
 * @function 10029
 * @param   decklist    The decklist to check the influence cost in.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10029'] = nonAllianceCards.bind(undefined, "Haas-Bioroid", 6);

/**
 * Calculates a multiplier for the influence cost of PAD Factory by counting the number of PAD Campaigns in the deck.
 * @function 10038
 * @param   decklist    The decklist to calculate the influence for.
 * @return  0 if the influence cost is free, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10038'] = (decklist) => {
    var padCampaigns = 0;
    if (decklist.cards["Asset"]) {
        decklist.cards["Asset"].forEach(card => {
            if (card.card.title === "PAD Campaign") {
                padCampaigns = card.quantity;
            }
        });
    }
    if (padCampaigns === 3) {
        return 0;
    } else {
        return 1;
    }
}

/**
 * The function for Jeeves Model Bioroids is bound to nonAllianceCards with 6 Haas-Bioroid cards minimum.
 * @function 10067
 * @param   decklist    The decklist to check the influence cost in.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10067'] = nonAllianceCards.bind(undefined, "Haas-Bioroid", 6);

/**
 * The function for Raman Rai is bound to nonAllianceCards with 6 Jinteki cards minimum.
 * @function 10068
 * @param   decklist    The decklist to check the influence cost in.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10068'] = nonAllianceCards.bind(undefined, "Jinteki", 6);

/**
 * The function for Salem's Hospitality is bound to nonAllianceCards with 6 NBN cards minimum.
 * @function 10071
 * @param   decklist    The decklist to check the influence cost in.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10071'] = nonAllianceCards.bind(undefined, "NBN", 6);

/**
 * The function for Executive Search Firm is bound to nonAllianceCards with 6 Weyland Consortium cards minimum.
 * @function 10072
 * @param   decklist    The decklist to check the influence cost in.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10072'] = nonAllianceCards.bind(undefined, "Weyland Consortium", 6);

/**
 * Calculates a multiplier for the influence cost of Mumbad Virtual Tour by counting the number of Assets in the deck.
 * @function 10038
 * @param   decklist    The decklist to calculate the influence for.
 * @return  0 if the influence cost is free, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10076'] = (decklist) => {
    var assets = 0;
    if (decklist.cards["Asset"]) {
        decklist.cards["Asset"].forEach(card => {
            assets += card.quantity;
        });
    }
    if (assets >= 7) {
        return 0;
    } else {
        return 1;
    }
}

/**
 * The function for Ibrahim Salem is bound to nonAllianceCards with 6 NBN cards minimum.
 * @function 10109
 * @param   decklist    The decklist to check the influence cost in.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
module.exports['10109'] = nonAllianceCards.bind(undefined, "NBN", 6);

/**
 * Calculates a multiplier for the influence cost of alliance cards that require a set number of in-faction non-alliance cards to be free.
 * @function    nonAllianceCards
 * @param   faction     The faction that cards must be to satisfy the requirement. Can any of 'Jinteki', 'Haas-Bioroid', 'NBN', 'Weyland Consortium'.
 * @param   minCards    The minimum number of such cards that must be in the deck to satisfy the requirement.
 * @param   decklist    The decklist to check for the requirement.
 * @return  0 if the influence cost in the given decklist is 0, otherwise 1. The result can be multiplied by the regular influence cost.
 */
function nonAllianceCards (faction, minCards, decklist) {
    var factionCards = 0;
    Object.keys(decklist.cards).forEach((type) => {
        decklist.cards[type].forEach((card) => {
            if (card.card.faction === faction && (!card.card.subtype || card.card.subtype.indexOf("Alliance") === -1)) {
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

