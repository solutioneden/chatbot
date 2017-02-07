'use strict';

// Imports
const express = require('express');
const bodyParser = require('body-parser');
const Smooch = require('smooch-core');

// Config
const PORT = 8000;
const KEY_ID = 'app_58994ddebc248758008df433';
const SECRET = 'CvOHTJk3kWX47994J1Ck7GrC';

const smooch = new Smooch({
    keyId: KEY_ID,
    secret: SECRET,
    scope: 'app'
});

var apiai = require('apiai');
var apiapp = apiai("047aa0a74e594b58b28466260427a574");

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
