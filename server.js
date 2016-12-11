var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/webhook', function(req, res) {
  var key = 'EAALKgEeJmWABALQ2pohDLEZAWIabSoQMBnb0VV5AiZApjUCZB1rdkqX3aGZBTvLUNAj2brnqtIAkaUwj1sDIuDxQYG48CC4PQPCXTEWOUKl2BhOL14KNb9eNN2twnBg0HLAVqPz0c4zEu160XH8SbO5MMpzkPFBrUw0t7Iyn1QZDZD'
  if (req.query['hub.verify_token'] === key) {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    if (messageText === 'hello') {
      sendTextMessage(senderID, "หนูไม่รู้");
    }if (messageText) {
   var location = messageText
   var weather = 'http://api.openweathermap.org/data/2.5/weather?q'+ messageText+ '=Bangkok,TH&APPID=7bb0ec281912240aaa2b0a632fe3f779'
   request({
     console.log(weather);
     url: weather,
     json: true
   }, function(error, response, body) {
     try {
       var condition = body.main;
       sendTextMessage(sender, "Today is " + condition.temp + "Celsius in " + messageText);
     } catch(err) {
       console.error('error caught', err);
       sendTextMessage(sender, "There was an error.");
     }
   })
 }

    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}
function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAALKgEeJmWABALQ2pohDLEZAWIabSoQMBnb0VV5AiZApjUCZB1rdkqX3aGZBTvLUNAj2brnqtIAkaUwj1sDIuDxQYG48CC4PQPCXTEWOUKl2BhOL14KNb9eNN2twnBg0HLAVqPz0c4zEu160XH8SbO5MMpzkPFBrUw0t7Iyn1QZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
