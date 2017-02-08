'use strict';

// Imports
const express = require('express');
const bodyParser = require('body-parser');
const Smooch = require('smooch-core');

const config = require('config');
module.exports = require('./config/' + (process.env.NODE_ENV || 'saint') + '.json');
console.log('NODE_ENV: ' + config.util.getEnv('NODE_ENV'));

// Config
const PORT = config.get('port');
const KEY_ID = config.get('smooch.key_id');
const SECRET = config.get('smooch.secret');

const smooch = new Smooch({
    keyId: KEY_ID,
    secret: SECRET,
    scope: 'app'
});

const apiai = require('apiai');
const apiapp = apiai(config.get('api.key_id'));

const app = express();

console.log('port: ' + config.get('port'));
console.log('smooch key_id: ' + config.get('smooch.key_id'));
console.log('smooch secret: ' + config.get('smooch.secret'));
console.log('api key_id: ' + config.get('api.key_id'));

app.use(bodyParser.json());

app.post('/chatbot', function(req, res) {
  console.log('webhook PAYLOAD:\n', JSON.stringify(req.body, null, 4));

  const appUserId = req.body.appUser._id;
  if (req.body.trigger === 'message:appUser') {

      let request = apiapp.textRequest(req.body.messages[0].text, {
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
