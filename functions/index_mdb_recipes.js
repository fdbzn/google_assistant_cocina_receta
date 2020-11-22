'use strict';
const Speech = require('ssml-builder');
var admin = require("firebase-admin");
const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
const MongoClient = require('mongodb').MongoClient;
const MONGO_URL = 'mongodb://fdbazan:mx2011lazonasucia@ds229415.mlab.com:29415/phily_one';

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  //console.log('Request headers: ' + JSON.stringify(request.headers));
  //console.log('Request body: ' + JSON.stringify(request.body));
  const ssmlSpeech = {
		'welcome' : ()=>{
			const speech = new Speech();
			speech.say('Hello');
			speech.pause('1s');
			speech.say('Welcome to Philadelphia!');
			speech.pause('1s');
			speech.say("Let's cook something");
			speech.pause('1.5s');
			speech.say("Say: Start");
			return speech.toObject(true);
		}
	}

  // An action is a string used to identify what needs to be done in fulfillment
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters

  // Parameters are any entites that Dialogflow has extracted from the request.
  const parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters

  // Contexts are objects used to track and store conversation state
  const inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts

  // Get the request source (Google Assistant, Slack, API, etc) and initialize DialogflowApp
  const requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const app = new DialogflowApp({request: request, response: response});

  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': () => {


      insert_new_user(request.body.sessionId);
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
			if (requestSource === googleAssistantRequest) {
				const speechWelcome = ssmlSpeech.welcome();
        sendResponse(speechWelcome);
      } else {
        sendResponse("Hello Welcome to Philadelphia! Lets cook something... Say: Start"); // Send simple response to user
      }

    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      }
    },

		'start_action': ()=>{
			if (requestSource === googleAssistantRequest) {
        list(app);
      } else {
        sendResponse('not implemented'); // Send simple response to user
      }
		},

    // Default handler for unknown or undefined actions
    'default': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        let responseToUser = {
          googleRichResponse: googleRichResponse, // Optional, uncomment to enable
          //googleOutputContexts: ['weather', 2, { ['city']: 'rome' }], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          displayText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        let responseToUser = {
          richResponses: richResponses, // Optional, uncomment to enable
          //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          displayText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendResponse(responseToUser);
      }
    }
  };

  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }

  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();

  function exist_user_id(user_id){
    var user = [];
    MongoClient.connect(MONGO_URL, (err, db) => {
      if (err) {
        return console.log(err);
      }

      // Do something with db here, like inserting a record
      db.collection('users').find(
        {
           "user_id": user_id
        },
        function (err, res) {
          if (err) {
            db.close();
            return console.log(err);
          }
          // Success
          res.each(function(err, doc) {
            if(doc) {
              user.push(doc);
            }
          });
          db.close();
        }
      )
    });
    return user;
  }

  function add_detail_recipe(session_id, query){
    MongoClient.connect(MONGO_URL, (err, db) => {
      if (err) {
        return console.log(err);
      }

      // Do something with db here, like inserting a record
      db.collection('users').update(
        {
          sessionId : session_id
        },
        function (err, res) {
          if (err) {
            db.close();
            return console.log(err);
          }
          // Success
          db.close();
        }
      )
    });
  }

  function insert_new_user( session_id ){
    MongoClient.connect(MONGO_URL, (err, db) => {
      if (err) {
        return console.log(err);
      }

      // Do something with db here, like inserting a record
      db.collection('users').insertOne(
        {
          sessionId : session_id
        },
        function (err, res) {
          if (err) {
            db.close();
            return console.log(err);
          }
          // Success
          db.close();
        }
      )
    });
  }

	function list (app) {
	  app.askWithList(app.buildRichResponse()
	    // Build a list
	    app.buildList('What recipe would you like to cook?')
	    // Add the first item to the list
	    .addItems(app.buildOptionItem('RECETA_1',
	      ['pollo', 'caldo de pollo', 'gallina'])
	      .setTitle('Crepas de manzana')
	      .setDescription('42 is an abundant number because the sum of its ' +
	        'proper divisors 54 is greater…')
	      .setImage('http://example.com/math_and_prime.jpg', 'Math & prime numbers'))
	    // Add the second item to the list
	    .addItems(app.buildOptionItem('EGYPT',
	      ['religion', 'egpyt', 'ancient egyptian'])
	      .setTitle('Ancient Egyptian religion')
	      .setDescription('42 gods who ruled on the fate of the dead in the ' +
	        'afterworld. Throughout the under…')
	      .setImage('http://example.com/egypt', 'Egypt')
	    )
	    // Add third item to the list
	    .addItems(app.buildOptionItem('RECIPES',
	      ['recipes', 'recipe', '42 recipes'])
	      .setTitle('42 recipes with 42 ingredients')
	      .setDescription('Here\'s a beautifully simple recipe that\'s full ' +
	        'of flavor! All you need is some ginger and…')
	      .setImage('http://example.com/recipe', 'Recipe')
	    )
	  );
	}

  // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });

      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }

      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext(...responseToUser.googleOutputContexts);
      }

      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }

  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};

      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;

      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.richResponses;

      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;

      response.json(responseJson); // Send response to Dialogflow
    }
  }
});

const recetas = [
	{
		"title": "Gelatina de queso",
		"description": "Prepara una deliciosa Gelatina con un toque de Philadelphia Deslactosado. ",
		"image": "https:\/\/www.philadelphia.com.mx\/modx\/assets\/img\/recetas\/principal\/recetas_full_v2\/postres\/gelatinas\/ph_sitio_1200x700-_0000s_0002_GelatinaDeQueso.png",
		"tiempo_preparacion": "30",
		"porciones": "10",
		"ingredientes": [
			"190g de Queso Crema Philadelphia\u00ae Deslactosado",
			"2 tza. de leche deslactosada",
			"\u00be tza. de az\u00facar",
			"1 cdita. de vainilla l\u00edquida",
			"3 sobres de grenetina en polvo",
			"\u00bd tza. de agua fr\u00eda",
			""
		],
		"preparacion": [
			"LICUAR el Queso Crema Philadelphia\u00ae Deslactosado junto con la leche, vainilla \u00a0y el az\u00facar.",
			"HIDRATAR la grenetina en \u00bd taza de agua fr\u00eda y dejar reposar por 5 minutos.",
			"FUNDIR la grenetina e incorporar a la licuadora con el resto de la mezcla.",
			"VERTER en un molde y refrigerar hasta cuajar .",
			""
		]
	},
	{
		"title": "Nachos Philadelphia con carne",
		"description": "Sorprende a tus invitados con las mejores recetas y recomendaciones para preparar deliciosos platillos. Comparte el sabor de unos Nachos Philadelphia con carne. ",
		"image": "https:\/\/www.philadelphia.com.mx\/modx\/assets\/img\/revision2016\/images\/recetas\/recetas_2015\/ph-mf-780x530_0005_Nachos-Philadelphia-con-carne.png",
		"tiempo_preparacion": "20",
		"porciones": "4",
		"ingredientes": [
			"140g de Queso Crema Philadelphia \u00ae en cubos medianos",
			"250 g de carne de res molida",
			"2 cdas. de cebolla picada",
			"1 cdita. de ajo picado",
			"1 cdita. de chile jalape\u00f1o picado",
			"\u00bc tza. de salsa BBQ",
			"Sal \u00a0y pimientaal gusto",
			"1 paquete de totopos de ma\u00edz",
			"1\/2 tza de tocino picado y frito",
			"2 cdas. de aceite vegetal",
			""
		],
		"preparacion": [
			"CALENTAR en una sart\u00e9n el aceite y saltear el ajo y la cebolla. Incorporar la carne y cocinar por unos minutos.",
			"AGREGAR el chile serrano, \u00a0la salsa BBQ , el tocino y el Queso Crema Philadelphia \u00ae .",
			"SAZONAR con sal y pimienta al gusto y mezclar hasta integrar perfectamente.",
			"SERVIR los totopos de ma\u00edz en un plat\u00f3n con la carne, y chiles jalape\u00f1os picados\u00a0",
			""
		]
	}
]

// Construct rich response for Google Assistant
const app = new DialogflowApp();
const googleRichResponse = app.buildRichResponse()
  .addSimpleResponse('This is the first simple response for Google Assistant')
  .addSuggestions(
    ['Suggestion Chip', 'Another Suggestion Chip'])
    // Create a basic card and add it to the rich response
  .addBasicCard(app.buildBasicCard(`This is a basic card.  Text in a
 basic card can include "quotes" and most other unicode characters
 including emoji 📱.  Basic cards also support some markdown
 formatting like *emphasis* or _italics_, **strong** or __bold__,
 and ***bold itallic*** or ___strong emphasis___ as well as other things
 like line  \nbreaks`) // Note the two spaces before '\n' required for a
                        // line break to be rendered in the card
    .setSubtitle('This is a subtitle')
    .setTitle('Title: this is a title')
    .addButton('This is a button', 'https://assistant.google.com/')
    .setImage('https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
      'Image alternate text'))
  .addSimpleResponse({ speech: 'This is another simple response',
    displayText: 'This is the another simple response 💁' });

// Rich responses for both Slack and Facebook
const richResponses = {
  'slack': {
    'text': 'This is a text response for Slack.',
    'attachments': [
      {
        'title': 'Title: this is a title',
        'title_link': 'https://assistant.google.com/',
        'text': 'This is an attachment.  Text in attachments can include \'quotes\' and most other unicode characters including emoji 📱.  Attachments also upport line\nbreaks.',
        'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
        'fallback': 'This is a fallback.'
      }
    ]
  },
  'facebook': {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [
          {
            'title': 'Title: this is a title',
            'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
            'subtitle': 'This is a subtitle',
            'default_action': {
              'type': 'web_url',
              'url': 'https://assistant.google.com/'
            },
            'buttons': [
              {
                'type': 'web_url',
                'url': 'https://assistant.google.com/',
                'title': 'This is a button'
              }
            ]
          }
        ]
      }
    }
  }
};
