var botbuilder = require('botbuilder');

const library = new botbuilder.Library('candidat');

library.dialog('apply', [

    function (session, args, next) {
        if (!session.userData.offers) {
            session.userData.offers = [];
        }
        if (args && args.reprompt && args.saved) {
            botbuilder.Prompts.choice(session, "Votre offre a été enregistrée. Que voulez vous faire ?", "Créer une nouvelle offre d'emploi|Voir toutes les offres d'emploi", {
                listStyle: botbuilder.ListStyle.button
            });
        } else if (args && args.reprompt) {
            botbuilder.Prompts.choice(session, "Que voulez vous faire ?", "Créer une nouvelle offre d'emploi|Voir toutes les offres d'emploi", {
                listStyle: botbuilder.ListStyle.button
            });
        } else {
            botbuilder.Prompts.choice(session, "Bienvenue ! Que voulez vous faire ?", "Montre moi les offres disponibles|Met à jour mon CV", {
                listStyle: botbuilder.ListStyle.button
            });
        }
        next();
    },
    function (session, results, next) {
        if (results.response.index == 0) {
            session.beginDialog('candidat:showOffer', session);
        } else if (results.response.index == 1) {
            session.beginDialog('candidat:editMenu', session);
        }
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// dialogue des affichages d'offres
library.dialog('showOffer', [
    function (session, results, next) {
        var fs = require('fs');
        var offersSaved = JSON.parse(fs.readFileSync('data/offers.json', 'utf8'));
        if (offersSaved.length == 0) {
            session.send('Aucune offre n\'est enregistrée');
        } else {
            var msg = new botbuilder.Message(session);
            msg.attachmentLayout(botbuilder.AttachmentLayout.carousel);
            var richcards = [];
            for (var i = 0; i < offersSaved.length; i++) {
                var dateOffer = new Date(offersSaved[i].date);
                var dayOffer = dateOffer.getDate().toString();
                var monthOffer = (dateOffer.getMonth() + 1).toString();
                dateOffer = (dayOffer[1] ? dayOffer : '0' + dayOffer[0]) + '/' + (monthOffer[1] ? monthOffer : '0' + monthOffer[0]) + '/' + dateOffer.getFullYear();
                var richcard = new botbuilder.HeroCard()
                    .title(offersSaved[i].title)
                    .subtitle("Date d'embauche : " + dateOffer)
                    .text("Description : " + offersSaved[i].description + "\n \r" +
                        "Date de création : " + offersSaved[i].creationDate)
                    .buttons([botbuilder.CardAction.dialogAction(session, 'applications', 'index=' + i, 'Détails')]);
                richcards.push(richcard);
            }
            msg.attachments(richcards);
            session.send(msg);
        }
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// dialogue des affichages d'offres
library.dialog('editMenu', [
    function (session, results, next) {
        botbuilder.Prompts.choice(session, "Ok, quelle partie souhaitez-vous mettre à jour ?", "Mes informations personnelles", {
            listStyle: botbuilder.ListStyle.button
        });
    },
    function (session, results, next) {
        if (results.response.index == 0) {
            session.beginDialog('candidat:editInfo', session);
        } else if (results.response.index == 1) {
            session.beginDialog('candidat:editMenu', session);
        }
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// dialogue des informations à modifier
library.dialog('editInfo', [
    function (session, results, next) {
        botbuilder.Prompts.choice(session, "Quelle information veux-tu modifier ?", "Mon nom|Mon prenom|Mon Adresse|Mon âge|Mon adresse Mail|Mon numéro de téléphone", {
            listStyle: botbuilder.ListStyle.button
        });
    },
    function (session, results, next) {
        if (results.response.index == 0) {
            session.beginDialog('candidat:editName', session);
        }
        else if (results.response.index == 1) {
            session.beginDialog('candidat:editSurname', session);
        }
        else if (results.response.index == 2) {
            session.beginDialog('candidat:editAdress', session);
        }
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// edit nom
library.dialog('editName', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Renseigne ton nom :");
    },
    function (session, results, next) {
        session.userData.last_name = results.response;
        console.log(session.userData.last_name);
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// edit prenom
library.dialog('editSurname', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Renseigne ton nom :");
    },
    function (session, results, next) {
        session.userData.first_name = results.response;
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// edit adresse
library.dialog('editAdress', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Renseigne ton adresse :");
    },
    function (session, results, next) {
        session.userData.address = results.response;
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

module.exports = library;

function save() {
    var fs = require('fs');
    if (results.response) {
        session.dialogData.candidateInfo.last_name = results.response;
    }
    var applicationSaved = JSON.parse(fs.readFileSync('data/applications.json', 'utf8'));
    if (!Array.isArray(applicationSaved)) {
        applicationSaved = [];
    }
    applicationSaved.push(session.dialogData.candidateInfo);
    console.log(applicationSaved);
    fs.writeFile("data/applications.json", JSON.stringify(applicationSaved));
};