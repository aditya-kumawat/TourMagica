var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	// latLng: {
		lat: Number,
		lng: Number,
	// },
	info: String,
	locationTag: String,
});

module.exports = mongoose.model('location', schema);