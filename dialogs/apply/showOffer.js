var botbuilder = require('botbuilder');

const library = new botbuilder.Library('candidat');

library.dialog('showOffer', [
    
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

module.exports = library;