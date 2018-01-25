var restify = require('restify');
var botbuilder = require('botbuilder');


// Setup restify

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
    console.log('%s bot started at %s', server.name, server.url);
});

// Setup connector
var connector = new botbuilder.ChatConnector({
   appId: process.env.APP_ID,
   appPassword: process.env.APP_PASSWORD
});

//listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new botbuilder.UniversalBot(connector, function(session) {
    session.beginDialog('chooseProfile');
});

bot.dialog('chooseProfile', [

    function (session, args, next) {
        botbuilder.Prompts.choice(session, "Bienvenue ! Qui êtes vous ?", "Je suis un candidat|Je suis un recruteur", {
            listStyle: botbuilder.ListStyle.button
        });
        next();

    },

    function (session, results, next) {
        if (results.response.index == 0) {
            session.beginDialog('candidat:apply', session.dialogData);
            bot.beginDialogAction('detailsOffer', 'candidat:detailsOffer');
        } else if (results.response.index == 1) {
            next();
        }

    },

    function (session, results, next) {
        if (!session.dialogData.password) {
            botbuilder.Prompts.text(session, "Quel est votre mot de passe ?");
        } else {
            next();
        }
    },

    function (session, results, next) {
        if (results.response) {
            if (results.response == process.env.RH_PASSWORD) {
                session.beginDialog('rh:offers', session.dialogData);
                bot.beginDialogAction('applications', 'rh:applications');
                bot.beginDialogAction('details', "rh:details");
            } else {
                bot.send('Le mot de passe n\'est pas correct.');
                session.replaceDialog('chooseProfile', { reprompt: true });
            }
        }
    }
]);

bot.library(require('./dialogs/rh'));
bot.library(require('./dialogs/candidat'));


//Integer Luis

// var luisEndpoint = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/5b099a10-12bf-43e7-ac5d-12316feeee29?subscription-key=2f222dad840b41a7805d929064f11122&verbose=true&timezoneOffset=0&q=";
// var luisRecognizer = new botbuilder.LuisRecognizer(luisEndpoint);
// bot.recognizer(luisRecognizer);
//
// bot.dialog('weather', [
//     //args contient la réponse que renverra luis dans un fichier json
//     function(session, args, next){
//         var intent = args.intent;
//         var location = botbuilder.EntityRecognizer.findEntity(intent.entities, 'Weather.Location');
//         console.log(`location: ${location.entity}`);
//         session.send(`il fait pas vraiment beau à ${location.entity} :( `)
//         console.log(`intent: ${JSON.stringify(intent)} || location: ${location}`)
//         if(intent === 'Weather.GetCondition' || intent === 'Weather.GetForecast'){
//             var location = botbuilder.EntityRecognizer.findEntity(intent.entities, 'Weather.Location');
//             session.send(`il fait pas vraiment beau à ${location.entity} :( `)
//             console.log(`intent: ${intent} || location: ${location}`)
//         }
//     }
// ]).triggerAction({
//     matches: ["Weather.GetCondition", "Weather.GetForecast"]
// }).cancelAction('CancelWeather', 'request canceled!', {
//     matches: /^cancel|abandonner/i,
//     confirmPrompt: 'Are you sure?'
// });