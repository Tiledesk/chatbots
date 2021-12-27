const express = require('express');
const bodyParser = require('body-parser');
const { TiledeskClient } = require('@tiledesk/tiledesk-client');
const { TiledeskChatbotUtil } = require('@tiledesk/tiledesk-chatbot-util');
let axios = require('axios');

const app = express();

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true , limit: '50mb'}));

app.post('/webhooks', (req, res) => {
  if (req.body.hook.event === 'request.update') {
    let request_id = req.body.payload.request_id;
    let rating = req.body.payload.rating;
    let rating_message = req.body.payload.rating_message;
    if (rating) {
      // ...
    }
  }
});

// **************************************************
// ************** SELECT LANGUAGE BOT ***************
// **************************************************

app.post('/lang_select_bot', (req, res) => {
  console.log("Webhook. Request body: " + JSON.stringify(req.body));
  // INTENTS
  let intent = null;
  if (req.body.payload.intent) {
    intent = req.body.payload.intent.intent_display_name;
  }
  console.log("Got intent:", intent);
  let senderFullname = req.body.payload.bot.name;
  let user_lang = req.body.payload.message.request.language;
  console.log("User language:", user_lang);
  let multilang_bot_id = req.body.payload.bot._id;
  console.log("Bot_id:", multilang_bot_id);
  let multilang_bot_id_as_partecipant = "bot_" + multilang_bot_id;
  console.log("multilang_bot_id_as_partecipant:", multilang_bot_id_as_partecipant);
  const name_match = JSON.parse(req.body.payload.bot.description).name_match;
  console.log("name_matches:", name_match);
  if (intent === 'start') {
    const API_URL = apiurlByOrigin(req.headers['origin']);
    const projectId = req.body.payload.bot.id_project;
    const token = req.body.token;
    //ADMIN_TOKEN = token;
    const ADMIN_TOKEN = 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZWJlNTIzYTkyYmVmZTAwMTkwNTRhZWMiLCJlbWFpbCI6ImFuZHJlYXNwb256aWVsbG9AdGlsZWRlc2suY29tIiwiZmlyc3RuYW1lIjoiQW5kcmVhIiwibGFzdG5hbWUiOiJTcG9uemllbGxvIiwiZW1haWx2ZXJpZmllZCI6dHJ1ZSwiaWF0IjoxNjM3OTE2NDY2LCJhdWQiOiJodHRwczovL3RpbGVkZXNrLmNvbSIsImlzcyI6Imh0dHBzOi8vdGlsZWRlc2suY29tIiwic3ViIjoidXNlciIsImp0aSI6IjYxNjMwNTA4LWRhMmMtNGQ1ZC1hMzdiLTkwNzNhMGFjYWMwMCJ9.R4K8HNGqy9LUMyiddRCYe8za8N5xOmmZDpdT-wteTkY';
    const requestId = req.body.payload.message.request.request_id;
    console.log("projectId:",projectId)
    //console.log("token:",token)
    console.log("requestId:",requestId)
    const tdclient = new TiledeskClient({projectId:projectId,token:token, APIURL: API_URL, APIKEY: "___", log:false});

    let message = {
      text: req.body.payload.text + '....',
      attributes: {
        subtype: 'info'
      }
    }
    res.json(message);

    tdclient.deleteRequestParticipant(
      requestId,
      multilang_bot_id_as_partecipant,
      (err, result) => {
    //deleteRequestParticipant(API_URL, projectId, requestId, multilang_bot_id_as_partecipant, "JWT " + token, (err, result) => {
      console.log("partecipant removed.", err);
      //tdclient.sendSupportMessage(requestId, {text: "lang bot removed."}, function(err) {
        //console.log("Message sent.");
        const tdclient2 = new TiledeskClient({projectId:projectId,token:ADMIN_TOKEN, APIURL: API_URL, APIKEY: "___", log:false});
        tdclient2.getAllBots((err, bots) => {
        //getAllBots(API_URL, projectId, ADMIN_TOKEN, (err, bots) => {
          if (err) {
            tdclient.sendSupportMessage(requestId, {text: "An error occurred 🙁 Contact administrator"});
            return;
          }
          console.log("BOTS:", bots);
          let bot_as_partecipant_id = null;
          for (i = 0; i < bots.length; i++) {
            const bot = bots[i];
            console.log(bot.description)
            const properties = JSON.parse(bot.description);
            if (properties && properties.name === name_match && bot.language === user_lang) {
              console.log("Bot found:", bot.name, bot._id);
              bot_as_partecipant_id = "bot_" + bot._id;
              break;
            }
          }
          if (bot_as_partecipant_id) {
            tdclient.addRequestParticipant(requestId, bot_as_partecipant_id, (err, result) => {
            //addRequestParticipant(API_URL, projectId, requestId, bot_as_partecipant_id, "JWT " + token, (err, result) => {
              if (err) {
                tdclient.sendSupportMessage(requestId, {text: `An error occurred adding the bot: ${bot_as_partecipant_id} 🙁 Contact administrator`});
                return;
              }
              console.log("partecipant added.", err);
              let message = {
                text: 'start',
                attributes: {
                  subtype: 'info'
                }
              }
              tdclient.sendSupportMessage(requestId, message, function(err) {
                console.log("start Message sent.");
              });
            });
          }
        });
        
      //});
    });
  }
  else {
    res.json({text: "I don't understand"});
  }
});

// ****************************************************
// ************** CHOOSE DEPARTMENT BOT ***************
// ****************************************************

app.post('/choose_dep_bot', (req, res) => {
  //console.log("Webhook. Request body: " + JSON.stringify(req.body));
  // INTENTS
  let intent = null;
  let payload = req.body.payload;
  if (payload.intent) {
    intent = payload.intent.intent_display_name;
  }
  console.log("Got intent:", intent);
  let senderFullname = payload.bot.name;
  let user_lang = payload.message.request.language;
  console.log("User language:", user_lang);
  let multilang_bot_id = payload.bot._id;
  console.log("Bot_id:", multilang_bot_id);
  let initial_bot_id = "bot_" + multilang_bot_id;
  console.log("initial_bot_id:", initial_bot_id);
  /*let welcome_message = 'Choose a team';
  if (req.body.payload.bot.description) {
    const attributes = JSON.parse(req.body.payload.bot.description);
    if (attributes.welcome_message) {
      welcome_message = attributes.welcome_message
    }
  }
  console.log("welcome_message:", welcome_message);*/
  const text = payload.message.text;
  const API_URL = apiurlByOrigin(req.headers['origin']);
  const projectId = payload.bot.id_project;
  const token = req.body.token;
  const requestId = payload.message.request.request_id;
  console.log("projectId:",projectId)
  console.log("token:",token)
  console.log("requestId:",requestId)
  const tdclient = new TiledeskClient({projectId:projectId,token:token, APIURL: API_URL, APIKEY: "___", log:true});
  if (intent === 'defaultFallback') {
    console.log("got defaultFallback", payload.message.text);
    let fallback_message = 'Department not found, please choose a team';
    if (payload.message.text) {
      fallback_message = payload.intent.answer;
    }
    getDepartments(API_URL, "JWT " + token, projectId, (err, deps) => {
      console.log("deps:", deps);
      let dep = null;
      for(i=0; i < deps.length; i++) {
        d = deps[i];
        if (d.name.toLowerCase() === payload.message.text.toLowerCase()) { //  && d.status == 1
          dep = d;
          break;
        }
      }
      if (dep) {
        tdclient.updateRequestDepartment(requestId, dep._id, null, (err) => {
          res.json(
            {
              text: "start",
              attributes: {
                subtype: 'info'
              }
            }
          );
        });
      }
      else {
        res.json({text: fallback_message + depButtons(deps)});
      }
    });
  }
  else if (intent === 'start') {
    let welcome_message = 'Choose a team';
    if (payload.message.text) {
      welcome_message = payload.intent.answer;
    }
    /*let message = {
      text: req.body.payload.text + '....',
      attributes: {
        subtype: 'info'
      }
    }
    res.json(message);*/
    getDepartments(API_URL, "JWT " + token, projectId, (err, deps) => {
      console.log("deps:", deps);
      const buttons = depButtons(deps);
      //console.log("buttons:", buttons);
      let message = {
        text: welcome_message + buttons
      }
      res.json(message);
      /*tdclient.sendSupportMessage(requestId, message, function(err) {
        console.log("Message sent.");
      });*/
    });
  }
  else {
    res.json({text: "Intent not found."});
  }
});

function depButtons(deps) {
  let dep_buttons = '';
  deps.forEach((d) => {
    if (!d.default) {
      dep_buttons += '\n* ' + d.name;
    }
  });
  return dep_buttons;
}

function getDepartments(API_URL, token, project_id, callback) {
  const URL = `${API_URL}/${project_id}/departments/allstatus`
  console.log("token: " + token)
  console.log("getDepartments.url: " + URL)
  myrequest({
    url: URL,
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': token
    },
    method: 'GET'
  },
  function(err, resbody) {
      if (err) {
        if (callback) {
          callback(err);
        }
      }
      else {
        if (callback) {
          callback(null, resbody);
        }
      }
    }, true
  );
}

function apiurlByOrigin(origin) {
  const API_URL_PRE = 'https://tiledesk-server-pre.herokuapp.com';
  const API_URL_PROD = 'https://api.tiledesk.com/v2';
  let server = 'prod';
  if (origin.indexOf('-pre') >= 0) {
    server = 'pre';
  }
  // choose a server
  let API_URL = API_URL_PROD;
  if (server === 'pre') {
    API_URL = API_URL_PRE;
  }
  return API_URL;
}

/*
function deleteRequestParticipant(APIURL, projectId, requestId, participantId, jwt_token, callback) {
  const URL = `${APIURL}/${projectId}/requests/${requestId}/participants/${participantId}`
  const HTTPREQUEST = {
    url: URL,
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': jwt_token
    },
    //json: participants,
    method: 'DELETE'
  };
  myrequest(
    HTTPREQUEST,
    function(err, resbody) {
      if (err) {
        if (callback) {
          callback(err);
        }
      }
      else {
        if (callback) {
          callback(null, resbody);
        }
      }
    }, true
  );
}

function addRequestParticipant(APIURL, projectId, requestId, participantId, jwt_token, callback) {
  console.log("questa......")
  const URL = `${APIURL}/${projectId}/requests/${requestId}/participants`
  const HTTPREQUEST = {
    url: URL,
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': jwt_token
    },
    json: {member: participantId},
    method: 'POST'
  };
  myrequest(
    HTTPREQUEST,
    function(err, resbody) {
      console.log("questa......00000")
      if (err) {
        console.log("questa......111")
        if (callback) {
          console.log("questa......2222")
          callback(err);
        }
      }
      else {
        console.log("questa......33333")
        if (callback) {
          console.log("questa......444444")
          callback(null, resbody);
        }
      }
    }, true
  );
}

function getAllBots(APIURL, projectId, jwt_token, callback) {
  console.log("11111")
  const URL = `${APIURL}/${projectId}/faq_kb`
  const HTTPREQUEST = {
    url: URL,
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': jwt_token
    },
    // json: {member: participant},
    method: 'GET'
  };
  myrequest(
    HTTPREQUEST,
    function(err, resbody) {
      console.log("22222")
      if (err) {
        console.error("An error occurred calling BOTS!")
        if (callback) {
          callback(err);
        }
      }
      else {
        console.log("33333")
        if (callback) {
          callback(null, resbody);
        }
      }
    }, true
  );
}
*/
function myrequest(options, callback, log) {
  console.log("BUUUU log", log)
  console.log("BUUUU options", options)
    if (log) {
      console.log("API URL:", options.url);
      console.log("** Options:", options);
    }
    axios(
      {
        url: options.url,
        method: options.method,
        data: options.json,
        headers: options.headers
      })
    .then(function (res) {
      if (log) {
        console.log("Response for url:", options.url);
        console.log("Response headers:\n", res.headers);
        //console.log("******** Response for url:", res);
        console.log("Response body:\n", res.data);
        console.log("Response status:", res.status);
      }
      if (res && res.status == 200 && res.data) {
        if (callback) {
          callback(null, res.data);
        }
      }
      else {
        if (callback) {
          callback(TiledeskClient.getErr({message: "Response status not 200"}, options, res), null, null);
        }
      }
    })
    .catch(function (error) {
      if (log) {
        console.log("Error:", error);
      }
      if (callback) {
        callback(error, null);
      }
    });
}

app.get('/', (req, res) => {
  var pjson = require('./package.json');
  console.log(pjson.version);
  res.send(pjson.description + " v" + pjson.version);
});

app.listen(3000, () => {
  console.log('server started');
});