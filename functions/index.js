'use strict';

var step_prep=0;
var selected_recipe = {};

const Speech = require('ssml-builder');
const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
var admin = require("firebase-admin");
const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  let action = request.body.result.action;
  const parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters

  const app = new DialogflowApp({request: request, response: response});
  const WELCOME_INTENT = 'input.welcome';

  function nextIntent(){
    // leer session
    fireBase.getUserById(request.body.sessionId, function(curUser){
       // si no existe step mostrar el listado
       if(curUser.length == 0){
         list (app)
       }else{
         // realizar accion dependiendo del paso
         for( var key in curUser ){
           let step = curUser[key].step;
           let recipe_option = curUser[key].recipe_option;

           // --- si existe el paso uno en db entonces di preparacion
           if( step == 1 ){
             // --- si es el ultimo paso termina
             if( step_prep < selected_recipe.preparacion.length ){
               actions.preparacion(recipe_option, step_prep)
               step_prep++;
             }else{
               // enviar mensaje de finalizacion de app
               app.ask('Is done! say bye...');
             }
           }

         }
         // verificar los extremos de las acciones

       }

    });


  }

  function welcomeIntent (app) {
    //guarda session del usuario
    fireBase.init();
    fireBase.fireNewRecord("users", {userId: request.body.sessionId});
    //muestra la lista de opciones
    list (app)
  }

  // --- this function is deprecated
  function recipeIntent (app) {
    // obten el nombre de la receta
    let recipe_name = parameters.recipe_name;
    // guarda la receta
    app.ask('Say Start! '+recipe_name);
  }

  function list (app) {

	  app.askWithList(app.buildRichResponse()
	    .addSimpleResponse('What recipe would you like to cook?'),
	    // Build a list
	    buildListRecipes(app)
	  );
	}

  function buildListRecipes(app){
    var buildList = app.buildList('Select One Recipe');
    // Add the first item to the list
    recetas.forEach(function(val,key){
      buildList.addItems(app.buildOptionItem('RECIPE_'+key, val.key)
        .setTitle("Recipe: " + val.title)
        .setDescription(val.description)
        .setImage(val.image, val.title))
    });
    return buildList;
  }

  function itemSelected () {
    // Get the user's selection
    const param = app.getContextArgument('actions_intent_option',
      'OPTION').value;

    // save option Selected
    fireBase.getUserById(request.body.sessionId, (curUser)=>{
      fireBase.updUserByUId(curUser, {
        step:1,
        recipe_option : param
      });
    });

    actions.ingredientes(param);
  }


  const fireBase = {
    ref : {},

    'init': ()=>{
      fireBase.fireConnect();
      fireBase.ref = fireBase.fireRef("server/saving-data/philyVoice");
    },

    'fireConnect' : ()=>{
      var serviceAccount = require("./creamcheese-dd3ecbd558ad.json");
      try{
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://creamcheese-fce3a.firebaseio.com"
        });
      }catch(err){
        console.log("ya existe una instancia")
      }
      return admin;
    },

    'fireRef': ( refPath )=>{
      var db = admin.database();
      return db.ref( refPath ); //"server/saving-data/philyVoice"
    },
    'fireNewRecord' : ( child, dataInsert ) => {
      var usersRef = fireBase.ref.child(child);  // "users"
      // we can also chain the two calls together
      usersRef.push().set( dataInsert );
    },
    'getUserById' : (user_id, callback)=>{
      var db = admin.database();
      var ref = db.ref("server/saving-data/philyVoice/users");
      ref.orderByChild('userId').equalTo(user_id).once('value',  function(snapshot){
        callback(snapshot.val());
      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      })
    },
    'updUserByUId' : (uId, updObj)=>{
      var key = Object.keys(uId)[0];
      var db = admin.database();
      var ref = db.ref("server/saving-data/philyVoice/users");

      var hopperRef = ref.child(key);
      hopperRef.update(updObj);


    }
  }

  const actions = {
    // --- param es el valor seleccionado por el usuario
    'ingredientes': (param)=>{
      recetas.forEach(function(val, key){
        if(param == "RECIPE_"+key){
          let receta_seleccionada = recetas[key];
          selected_recipe = receta_seleccionada;

          let ssmlIngredients = ssmlSpeech.ingredients(receta_seleccionada.ingredientes);
          app.ask(ssmlIngredients);
        }
      });
    },
    'preparacion': (param, paso_preparacion)=>{
      recetas.forEach(function(val, key){
        if(param == "RECIPE_"+key){
          let receta_seleccionada = recetas[key];
          let ssmlPreparacion = ssmlSpeech.preparacion(receta_seleccionada.preparacion[paso_preparacion]);
          app.ask(ssmlPreparacion);
        }
      });
    }
  }
  const recetas = [
  	{
  		"title": "Cheesy Chicken Enchilada Dinner",
  		"description": "Homemade enchiladas don’t have to take hours to make! In just 40 minutes, this taste-tempting version can be on the table and ready to enjoy.",
  		"image": "https:\/\/www.philadelphia.com.mx\/modx\/assets\/img\/recetas\/principal\/recetas_full_v2\/comida\/Pollo\/ph_sitio_1200x700_Enchiladas-rojas-cremosas-3.png",
  		"tiempo_preparacion": "20",
  		"porciones": "8",
  		"ingredientes": [
  			"1 lb. boneless skinless chicken breasts, cut into bite-size pieces",
  			"1 jar (16 oz.) TACO BELL® Thick & Chunky Salsa, divided",
  			"1-1/4 cups KRAFT Shredded Cheddar Cheese, divided",
  			"1/4 cup chopped fresh cilantro",
  			"10 flour tortillas (8 inch)",
  			"2-1/2 cups frozen corn"
  		],
  		"preparacion": [
  			"Heat oven to 350°F."
        ,"Cook and stir chicken in large nonstick skillet on medium-high heat 6 min. or until done. Stir in 1/2 cup salsa, 2/3 cup cheese and cilantro. Remove from heat."
        ,"Spread 1 cup salsa onto bottom of 13x9-inch baking dish. Spoon 1/4 cup chicken mixture down center of each tortilla; roll up. Place, seam-sides down, in baking dish; top with remaining salsa and cheese."
        ,"Bake 20 min. or until heated through, cooking corn as directed on package near end of chicken baking time."
        ,"Serve chicken with corn."
      ]
  	},
  	{
  		"title": "Burritos de pollo con Philadelphia",
  		"description": "No need to head out to Denver for these burritos! With fresh veggies, slow cooked ham and warmed tortillas, you're already on the road to enjoyment.",
  		"image": "https:\/\/www.philadelphia.com.mx\/modx\/assets\/img\/revision2016\/images\/recetas\/recetas_2015\/ph-780x530_0007_burritos-de-pollo.png",
  		"tiempo_preparacion": "140",
  		"porciones": "12",
  		"ingredientes": [
        "1 tub (10 oz.) PHILADELPHIA Cream Cheese Spread",
        "2 Tbsp. milk",
        "1/2 tsp. dried Italian seasoning",
        "8 eggs",
        "1/2 cup each chopped green peppers and onions",
        "1 cup chopped OSCAR MAYER CARVING BOARD Slow Cooked Ham",
        "8 flour tortillas (8 inch), warmed"
  		],
  		"preparacion": [
  			"Mix cream cheese spread, milk and seasoning until blended. ",
        "Whisk eggs and 1/2 cup cream cheese mixture until blended.",
        "Cook and stir vegetables and ham in large skillet sprayed with cooking spray on medium heat 2 to 3 min. or until vegetables are crisp-tender. Add egg mixture; cook 3 min. or until set, stirring occasionally.",
        "Spread tortillas with remaining cream cheese mixture; top with egg mixture. Fold in opposite sides of each tortilla, then roll up, burrito style."
  		]
  	}
  ];

  const ssmlSpeech = {
		'ingredients' : ( ingredient_items )=>{
			const speech = new Speech();
			speech.say('We need..');
			speech.pause('.5s');
      ingredient_items.forEach(function(val,key){
        speech.say(val);
        speech.pause('.5s');
      });
      speech.pause('.5s');
      speech.say('Are you ready? say "NEXT"');

			return speech.toObject(true);
		},
    'preparacion' : ( preparacion_item )=>{
			const speech = new Speech();
		  speech.sayAs({
        word: step_prep+1,
        interpret: "ordinal"
      });
      speech.pause('.5s');
      speech.say(preparacion_item);
      speech.pause('.5s');
      speech.say('Are you ready? say "NEXT"');

			return speech.toObject(true);
		}
	};

  const actionMap = new Map();
  actionMap.set(WELCOME_INTENT, welcomeIntent);
  actionMap.set("next_intent", nextIntent);
  actionMap.set("actions_intent_OPTION", itemSelected);
  app.handleRequest(actionMap);
});
