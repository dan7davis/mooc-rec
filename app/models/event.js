var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
    anonID: String,
    currentVert: String,
    recdVert: String,
    followed: String,
    timestamp: String,
    eventType: String
}, {
	timestamps: true
});

module.exports = mongoose.model('Event', EventSchema);