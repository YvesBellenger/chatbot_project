var botbuilder = require('botbuilder');
var uniqid = require('uniqid');

const library = new botbuilder.Library('rh');

library.dialog('offers', [

    function(session, args, next) {
        if (!session.userData.offers) {
            session.userData.offers = [];
        }
        if (args && args.reprompt && args.saved) {
            botbuilder.Prompts.choice(session, "Votre offre a été enregistrée. Que voulez vous faire ?", "Créer une nouvelle offre d'emploi|Voir toutes les offres d'emploi", { listStyle: botbuilder.ListStyle.button });
        } else if (args && args.reprompt) {
            botbuilder.Prompts.choice(session, "Que voulez vous faire ?", "Créer une nouvelle offre d'emploi|Voir toutes les offres d'emploi", { listStyle: botbuilder.ListStyle.button });
        } else {
            botbuilder.Prompts.choice(session, "Bienvenue ! Que voulez vous faire ?", "Créer une nouvelle offre d'emploi|Voir toutes les offres d'emploi", { listStyle: botbuilder.ListStyle.button });
        }
        next();
    },
    function (session, results, next) {
        if (results.response.index == 0) {
            session.dialogData.currentOffer = {};
            if (!session.dialogData.currentOffer.title) {
                botbuilder.Prompts.text(session, "Veuillez renseigner le titre de l'offre.");
            } else {
                next();
            }
        } else if (results.response.index == 1) {
            var fs = require('fs');
            var offersSaved = JSON.parse(fs.readFileSync('data/offers.json', 'utf8'));
            if (offersSaved.length == 0) {
                session.send('Aucune offre n\'est enregistrée');
            } else {
                var msg = new botbuilder.Message(session);
                msg.attachmentLayout(botbuilder.AttachmentLayout.carousel);
                var richcards = [];
                for (var i = 0; i<offersSaved.length; i++) {
                    var dateOffer = new Date(offersSaved[i].date);
                    var dayOffer = dateOffer.getDate().toString();
                    var monthOffer = (dateOffer.getMonth() + 1).toString();
                    dateOffer = (dayOffer[1] ? dayOffer : '0' + dayOffer[0]) + '/' + (monthOffer[1] ? monthOffer : '0' + monthOffer[0]) + '/' + dateOffer.getFullYear();
                    var richcard =  new botbuilder.HeroCard()
                        .title(offersSaved[i].title)
                        .subtitle("Date d'embauche : " + dateOffer)
                        .text("Description : " + offersSaved[i].description  + "\n \r" +
                            "Date de création : " + offersSaved[i].creationDate)
                        .buttons([botbuilder.CardAction.dialogAction(session, 'applications', 'id=' + offersSaved[i].id, 'Voir les candidatures')]);
                    richcards.push(richcard);
                }
                msg.attachments(richcards);
                session.send(msg);
            }
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.currentOffer.title = results.response;
        }
        if (!session.dialogData.currentOffer.date) {
            botbuilder.Prompts.time(session, "Renseignez la date d'embauche (format: mm/dd/yyyy).");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.currentOffer.date = botbuilder.EntityRecognizer.resolveTime([results.response]);
        }
        if (!session.dialogData.currentOffer.description) {
            botbuilder.Prompts.text(session, "Renseignez la description.");
        } else {
            next();
        }
    },
    function (session, results) {
        if (results.response) {
            session.dialogData.currentOffer.description = results.response;

            var dateCreate = new Date();
            var dayCreate = dateCreate.getDate().toString();
            var monthCreate = (dateCreate.getMonth() + 1).toString();
            dateCreate = (dayCreate[1] ? dayCreate : '0' + dayCreate[0]) + '/' + (monthCreate[1] ? monthCreate : '0' + monthCreate[0]) + '/' + dateCreate.getFullYear();
            session.dialogData.currentOffer.creationDate = dateCreate;
            session.dialogData.currentOffer.id = uniqid();
            session.userData.offers.push(session.dialogData.currentOffer);
            var fs = require('fs');
            var offersSaved = JSON.parse(fs.readFileSync('data/offers.json', 'utf8'));
            if (!Array.isArray(offersSaved)) {
                offersSaved = [];
            }
            offersSaved.push(session.dialogData.currentOffer);

            fs.writeFile("data/offers.json", JSON.stringify(offersSaved));

            session.replaceDialog('offers', { reprompt: true, saved: true });

        }
        session.endDialogWithResult({ response: session.dialogData });
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

library.dialog('applications', [
    function(session, args, next) {
        var fs = require('fs');
        var applications = JSON.parse(fs.readFileSync('data/applications.json', 'utf8'));
        var id = args.data.substr(3);
        for (var i = 0; i<applications.length; i++) {
            if (id == applications[i].offerId) {
                var msg = new botbuilder.Message(session);
                msg.attachmentLayout(botbuilder.AttachmentLayout.carousel);
                var richcards = [];
                for (var j = 0; j<applications[i].applications.length; j++) {
                    var candidat = applications[i].applications[j];

                    var richcard =  new botbuilder.HeroCard()
                        .title(candidat.first_name + ' ' + candidat.last_name)
                        .text("Email : " + candidat.email +  "\n \r" +
                              "Téléphone : " + candidat.phone)
                        .buttons([botbuilder.CardAction.dialogAction(session, 'details', 'id=' + candidat.id, 'Voir les détails')]);
                    richcards.push(richcard);
                }
                msg.attachments(richcards);
                session.send(msg);
            }
        }
    }
]);


library.dialog('details', [
    function(session, args, next) {
        var fs = require('fs');
        var applications = JSON.parse(fs.readFileSync('data/applications.json', 'utf8'));
        var id = args.data.substr(3);
        for (var i = 0; i<applications.length; i++) {
            for(var j = 0; j < applications[i].applications.length; j++){
                if (id == applications[i].applications[j].id) {
                    var candidat = applications[i].applications[j];
                    botbuilder.Prompts.text(session, "nom : " + candidat.last_name + 
                    "\n \r prénom : " + candidat.first_name +
                    "\n \r email : " + candidat.email +
                    "\n \r téléphone : " + candidat.numero);
                    for(var k = 0; k<candidat.experiences.length; k++){
                        botbuilder.Prompts.text(session,"- " + candidat.experiences[k].experience + 
                        " de " + candidat.experiences[k].start + " à " + candidat.experiences[k].end + "\n \r");
                    }
                    for(var k = 0; k<candidat.competences.length; k++){
                        botbuilder.Prompts.text(session,"- " + candidat.competences[k] + "\n \r");
                    }
                }
            }            
        }
    }
]);

module.exports = library;