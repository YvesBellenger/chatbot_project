var botbuilder = require('botbuilder');
var fs = require('fs');
var uniqid = require('uniqid');
var moment = require('moment');
moment.locale('fr');

const library = new botbuilder.Library('candidat');

var tmpCompetences = {};
var tmpExperience = {};

library.dialog('apply', [

    function (session, args, next) {
        if (!session.userData.experiences) {
            session.userData.experiences = [];
        }
        if (!session.userData.competences) {
            session.userData.competences = [];
        }
        if (!session.userData.id) {
            session.userData.id = uniqid();
        }
        botbuilder.Prompts.choice(session, "Bienvenue ! Que voulez vous faire ?", "Montre moi les offres disponibles|Met à jour mon CV", {
            listStyle: botbuilder.ListStyle.button
        });
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
                    .buttons([botbuilder.CardAction.dialogAction(session, 'detailsOffer', 'id=' + offersSaved[i].id, 'Voir les détails')]);
                richcards.push(richcard);
            }
            msg.attachments(richcards);
            session.send(msg);
        }
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// dialogue pour afficher les détails d'une offre
library.dialog('detailsOffer', [
    function(session, args, next) {
        var offersSaved = JSON.parse(fs.readFileSync('data/offers.json', 'utf8'));
        var id = args.data.substr(3);
        var offerSelected = null;
        for (var i = 0; i<offersSaved.length; i++) {
            if (offersSaved[i].id == id) {
                offerSelected = offersSaved[i];
            }
        }
        session.conversationData.offerId = offerSelected.id;
        var dateEmbauche = new moment(offerSelected.date).format('LL');
        session.send('Voici les détails de l\’offre : <br /> '
                    + 'Titre: ' + offerSelected.title + ' <br />'
                    + 'Date d\'embauche: ' + dateEmbauche + ' <br />'
                    + 'Description: ' + offerSelected.description);

        botbuilder.Prompts.choice(session, "Que voulez vous faire ?", "Candidater|Retour", {
            listStyle: botbuilder.ListStyle.button
        });
        next();
    },
    function (session, results, next) {
        if (results.response.index == 0) {
            var applicationsSaved = JSON.parse(fs.readFileSync('data/applications.json', 'utf8'));
            var offerSelected = null;

            if (applicationsSaved.length > 1){
                for (var i = 0; i<applicationsSaved.length; i++){
                    if (applicationsSaved[i].offerId == session.conversationData.offerId) {
                        offerSelected = applicationsSaved[i];
                    }
                }
            }
            if (offerSelected == null) {
                applicationsSaved.push({"offerId": session.conversationData.offerId, "applications": [session.userData]});
            } else {
                var alreadyApplied = false;
                for (var i = 0; i<offerSelected.applications.length; i++) {
                    if (offerSelected.applications[i].id == session.userData.id) {
                        alreadyApplied = true;
                    }
                }
                if (!alreadyApplied) {
                    offerSelected.applications.push(session.userData);
                } else {
                    session.send('Vous avez déjà candidaté à cette offre.');
                }
            }
            fs.writeFile("data/applications.json", JSON.stringify(applicationsSaved));
            session.beginDialog('candidat:showOffer', session);
        } else if (results.response.index == 1) {
            session.beginDialog('candidat:showOffer', session);
        }
    }
]);

// dialogue des affichages d'offres
library.dialog('editMenu', [
    function (session, results, next) {
        botbuilder.Prompts.choice(session, "Ok, quelle partie souhaitez-vous mettre à jour ?", "Mes informations personnelles|Mes compétences|Mes expériences professionnelle|Retour", {
            listStyle: botbuilder.ListStyle.button
        });
    },
    function (session, results, next) {
        if (results.response.index == 0) {
            session.beginDialog('candidat:editInfo', session);
        }
        else if (results.response.index == 1) {
            session.beginDialog('candidat:editCompetences', session);
        }
        else if (results.response.index == 2) {
            session.beginDialog('candidat:editExperiences', session);
        }
        else if (results.response.index == 3) {
            session.beginDialog('candidat:apply', session);
        }
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// dialogue des informations à modifier
library.dialog('editInfo', [
    function (session, results, next) {
        botbuilder.Prompts.choice(session, "Quelle information veux-tu modifier ?", "Mon nom|Mon prenom|Mon adresse Mail|Mon numéro de téléphone|Retour", {
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
            session.beginDialog('candidat:editEmail', session);
        }
        else if (results.response.index == 3) {
            session.beginDialog('candidat:editNumber', session);
        }
        else if (results.response.index == 4) {
            session.beginDialog('candidat:editMenu', session);
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
        session.beginDialog('candidat:editInfo', session);
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// edit prenom
library.dialog('editSurname', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Renseigne ton prénom :");
    },
    function (session, results, next) {
        session.userData.first_name = results.response;
        session.beginDialog('candidat:editInfo', session);
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// edit email
library.dialog('editEmail', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Renseigne ton adresse mail :");
    },
    function (session, results, next) {
        session.userData.email = results.response;
        session.beginDialog('candidat:editInfo', session);
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// edit numéro
library.dialog('editNumber', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Renseigne ton numéro :");
    },
    function (session, results, next) {
        session.userData.numero = results.response;
        session.beginDialog('candidat:editInfo', session);
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// dialogue des compétences à modifier
library.dialog('editCompetences', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Dis-moi, quelle compétence penses-tu avoir qui pourrait intéresser les recruteurs ? (tape retour si tu as finis)");
    },
    function (session, results, next) {
        var regx = RegExp("^(r|R)etour$");
        if(regx.test(results.response)){
            session.beginDialog('candidat:editMenu', session);
        }else{
            tmpCompetences.competences = results.response;
            botbuilder.Prompts.number(session, "Et quelle note, sur 5, donnerais-tu à cette compétences ? (" + tmpCompetences.competences + ")");
        }
    },
    function (session, results, next) {
        tmpCompetences.note = results.response;
        session.userData.competences.push(tmpCompetences);
        session.beginDialog('candidat:editCompetences', session);
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

// dialogue des experiences à modifier
library.dialog('editExperiences', [
    function (session, results, next) {
        botbuilder.Prompts.text(session, "Cites-moi une experience professionnelle (tape retour si tu as finis)");
    },
    function (session, results, next) {
        var regx = RegExp("^(r|R)etour$");
        if(regx.test(results.response)){
            session.beginDialog('candidat:editMenu', session);
        }else{
            tmpExperience.experience = results.response;
            botbuilder.Prompts.text(session, "Quand as-tu débuté ?");
        }
    },
    function (session, results, next) {
        tmpExperience.start = results.response;
        botbuilder.Prompts.text(session, "Et quand est-ce que ça c'est fini ?");
    },
    function (session, results, next) {
        tmpExperience.end = results.response;
        session.userData.experiences.push(tmpExperience);
        session.beginDialog('candidat:editExperiences', session);
    }
]).endConversationAction('cancelAction', 'Opération annulée.', {
    matches: /^annuler|quitter/i
});

module.exports = library;