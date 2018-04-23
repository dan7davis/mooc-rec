// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var fs		   = require('fs');
var morgan     = require('morgan');
var https 	   = require('https');

var key = fs.readFileSync('/etc/letsencrypt/live/lambda-viz.ewi.tudelft.nl/privkey.pem');
var cert = fs.readFileSync('/etc/letsencrypt/live/lambda-viz.ewi.tudelft.nl/fullchain.pem');

var options = {
	key: key,
	cert: cert
};

// configure app
app.use(morgan('dev')); // log requests to the console


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port     = process.env.PORT || 443; // set our port

// DATABASE SETUP
var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost'); // connect to our database

// Handle the connection event
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
    console.log("DB connection alive");
});

// Event models lives here
var Event     = require('./app/models/event');

// ROUTES FOR OUR API
// =============================================================================

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, X-CSRFToken, Content-Type, Accept");
    req.header("Access-Control-Allow-Origin", "*");
    req.header("Access-Control-Allow-Headers", "*");
    // console.log('Something is happening.');
    next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

// on routes that end in /events
// ----------------------------------------------------
router.route('/events')

// create a event (accessed at POST http://localhost:8080/events)
    .post(function(req, res) {

        var event = new Event();		// create a new instance of the Event model
        event.anonID = req.body.anonID;  // set the events name (comes from the request)
        event.currentVert = req.body.currentVert;
        event.recdVert = req.body.recdVert;
        event.followed = req.body.followed;
        event.timestamp = req.body.timestamp;
        event.eventType = req.body.eventType;

        event.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'POST event created!' });
        });


    })

    // get all the events (accessed at GET http://localhost:8080/api/events)
    .get(function(req, res) {
        Event.find(function(err, events) {
            if (err)
                res.send(err);

            res.json(events);
        });
    });








// on routes that end in /events/:event_id
// ----------------------------------------------------
router.route('/events/:anonID')

// get the event with that id
// .get(function(req, res) {
// 	Event.findById(req.params.event_id, function(err, event) {
// 		if (err)
// 			res.send(err);
// 		res.json(event);
// 	});
// });

    .get(function(req, res) {
        req.header("Access-Control-Allow-Origin", "*");
        req.header("Access-Control-Allow-Headers", "*");
        Event.find({ 'anonID': req.params.anonID, 'eventType': 'load' }, function(err, events) {
            if (err)
                res.send(err);

            res.json(events);
        }).sort({createdAt: -1}).limit(3);
    });




// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
https.createServer(options, app).listen(port);
console.log('Magic happens on port ' + port);
