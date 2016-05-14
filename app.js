// Webtask (https://webtask.io/) which on a GET returns a page that lets you use spech 
// recognition to fill out a form for creating a new trello card.  The form will POST
// to the webtask, which will then send the content to an ifttt Maker Channel.   
//
// When deploying the webtask, pass the maker channel key via the --SECRET parameter.
// e.g. wt create app.js --no-parse --no-merge --secret MAKER_KEY="MY_MAKER_KEY"
// 
// You can get the key for your maker channel by navigating to: https://ifttt.com/maker

var Express = require('express');
var bodyParser = require('body-parser');
var Webtask = require('webtask-tools');
var request = require('request');

const page = `
<html>
    <head>
        <!-- SKELETON -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/skeleton/2.0.4/skeleton.css">
    </head>
    <body>
        <div class="container">
            <h1>Trello Voice</h1>
            <p>Use voice to create new trello cards</p>
            <form id="form" action="?" method="post">
                <div class="row">
                    <div class="six columns">
                        <label for="trelloListInput">Speak 'list [listname]'</label>
                        <input class="u-full-width" type="text" placeholder="trello list name" id="trelloListInput" name="value1">
                    </div>
                    <div class="six columns">
                        <label for="cardTitleInput">Speak 'title [title]'</label>
                        <input class="u-full-width" type="text" placeholder="trello card title" id="cardTitleInput" name="value2">
                    </div>
                </div>
                <label for="descriptionInput">Speak 'description [description]'</label>
                <input class="u-full-width" type="text" placeholder="trello card description" id="descriptionInput" name="value3">
                
                <label style="display: inline;">Say </label><input class="button-primary" type="submit" value="Submit">
            </form>

            <p id="unrecognized"/>

            <!-- Voice Recognition for filling form -->
            <script src="https://code.jquery.com/jquery-2.2.3.min.js" integrity="sha256-a23g1Nt4dtEYOj7bR+vTu7+T8VP13humZFBJNIYoEJo=" crossorigin="anonymous"></script>
            <script src="//cdnjs.cloudflare.com/ajax/libs/annyang/2.4.0/annyang.min.js"></script>
            <script>
                if (annyang) {
                  var commands = {
                    'list *listname': function(listname) {
                      $('#trelloListInput').val(listname);
                    },

                    'title *title': function(title) {
                        $('#cardTitleInput').val(title);
                    },

                    'description *description': function(description) {
                        $('#descriptionInput').val(description);
                    },

                    'submit': function() {
                        console.log("submit");
                        $('#form').submit()
                    }
                  };

                  // Add our commands to annyang
                  annyang.addCommands(commands);

                  annyang.addCallback('resultNoMatch', function(phrases) {
                    console.log(phrases);
                    $('#unrecognized').text('Possibly said: ' + JSON.stringify(phrases));
                  });

                  annyang.addCallback('error', function() {
                    $('#unrecognized').text('There was an error!');
                  });

                  // Start listening. You can call this here, or attach this call to an event, button, etc.
                  annyang.start({ autoRestart: true });
                }
            </script>
        </div>
    </body>
</html>
`

const MAKER_EVENT="trello_card_created"

var app = Express();

// Parse x-www-form-urlencoded content
app.use(bodyParser.urlencoded({ extended: true }));


// API - POST NEW CARD
app.post('/', function (req, res) {
    // The key to the maker channel should be deployed with the 
    // webtask using the --Secret parameter
    var makerKey = req.webtaskContext.data.MAKER_KEY;

    var url = `https://maker.ifttt.com/trigger/${MAKER_EVENT}/with/key/${makerKey}`
    var options = {
        url: url,
        method: "POST",
        json: req.body
    }

    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            res.redirect('back');
        } else {
            res.status(500).send(response.body);
        }
    });
});

// GET - WEB PAGE
app.get('/', function (req, res) {
    res.send(page);
});

module.exports = Webtask.fromExpress(app);