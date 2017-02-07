'use strict';

// Imports
const express = require('express');
const bodyParser = require('body-parser');
const Smooch = require('smooch-core');

var config = require('./config');

// Config
const PORT = config.port;
const KEY_ID = config.smooth.keyId;
const SECRET = config.smooth.secret;

const smooch = new Smooch({
    keyId: KEY_ID,
    secret: SECRET,
    scope: 'app'
});

var apiai = require('apiai');
var apiapp = apiai(config.api.keyId);

const app = express();

app.use(bodyParser.json());

app.post('/chatbot', function(req, res) {
  console.log('webhook PAYLOAD:\n', JSON.stringify(req.body, null, 4));

  const appUserId = req.body.appUser._id;
  if (req.body.trigger === 'message:appUser') {

      var request = apiapp.textRequest(req.body.messages[0].text, {
          sessionId: appUserId
      });

      request.on('response', function(response) {
          console.log(response);

          console.log(JSON.stringify(response, null, 4));

          if (typeof response.result.fulfillment.messages !== 'undefined' && response.result.fulfillment.messages !== null){

            console.log('message: ' + response.result.fulfillment.messages[0].imageUrl);
                smooch.appUsers.sendMessage(appUserId, {
                    type: 'image',
                    mediaUrl: response.result.fulfillment.messages[0].imageUrl,
                    role: 'appMaker'
                }).then((response) => {
                    res.end();
                }).catch((err) => {
                  console.log(err);
                    res.end();
                });             
          }

          smooch.appUsers.sendMessage(appUserId, {
              type: 'text',
              text: response.result.fulfillment.speech,
              role: 'appMaker'
          }).then((response) => {
              res.end();
          }).catch((err) => {
              res.end();
          });
      });

      request.on('error', function(error) {
          console.log(error);
      });

      request.end();
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
