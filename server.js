var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/webhook', function (req, res) {
  var key = 'EAALKgEeJmWABALQ2pohDLEZAWIabSoQMBnb0VV5AiZApjUCZB1rdkqX3aGZBTvLUNAj2brnqtIAkaUwj1sDIuDxQYG48CC4PQPCXTEWOUKl2BhOL14KNb9eNN2twnBg0HLAVqPz0c4zEu160XH8SbO5MMpzkPFBrUw0t7Iyn1QZDZD'
  if (req.query['hub.verify_token'] === key) {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})

app.post('/webhook', function (req, res) {
  var data = req.body

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function (entry) {
      var pageID = entry.id
      var timeOfEvent = entry.time

      // Iterate over each messaging event
      entry.messaging.forEach(function (event) {
        if (event.message) {
          receivedMessage(event)
        } else {
          console.log('Webhook received unknown event: ', event)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200)
  }
})
function receivedMessage (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id
  var timeOfMessage = event.timestamp
  var message = event.message

  console.log('Received message for user %d and page %d at %d with message:', senderID, recipientID, timeOfMessage)
  console.log(JSON.stringify(message))

  var messageId = message.mid
  var messageText = message.text
  var messageAttachments = message.attachments

  if (messageText) {
    if (messageText === 'พยากรณ์อากาศ') {
      sendTextMessage(senderID, "พิมพ์ชื่อจังหวัด");
    } else if (messageText ) {
      var location = event.message.text
      var weather = 'http://api.openweathermap.org/data/2.5/weather?q=' +location+ '&units=metric&appid=7bb0ec281912240aaa2b0a632fe3f779'
      request({
        url: weather,
        json: true
      }, function(error, response, body) {
        try {
          var condition = body.main;
          var fastwind = body.wind
          sendTextMessage(senderID, "ตอนนี้" + condition.temp + " องศา " + location + "."+"อุณหภูมิต่ำสุด"+ condition.temp_min + " องศา "+"อุณหภูมิสูงสุด"+condition.temp_max + " องศา "+"ความเร็วลม"+ fastwind.speed);
        } catch(err) {
          console.error('error caught', err);
          sendTextMessage(senderID, "พิมพ์ใหม่อีกครั้ง");
        }
      })
    }

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    // switch (messageText) {
    //   case 'generic':
    //     sendGenericMessage(senderID)
    //     break
    //
    //   default :
    //     sendTextMessage(senderID, messageText)
    // }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'พิมพ์คำว่าพยากรณ์อากาศสิ')
  }
}
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendTextMessage (recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  }

  callSendAPI(messageData)
}

function callSendAPI (messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAALKgEeJmWABALQ2pohDLEZAWIabSoQMBnb0VV5AiZApjUCZB1rdkqX3aGZBTvLUNAj2brnqtIAkaUwj1sDIuDxQYG48CC4PQPCXTEWOUKl2BhOL14KNb9eNN2twnBg0HLAVqPz0c4zEu160XH8SbO5MMpzkPFBrUw0t7Iyn1QZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var recipientId = body.recipient_id
      var messageId = body.message_id

      console.log('Successfully sent generic message with id %s to recipient %s', messageId, recipientId)
    } else {
      console.error('Unable to send message.')
      console.error(response)
      console.error(error)
    }
  })
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
