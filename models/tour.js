var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	age: Number,
	gender: String,
	timestamp: {type: Date, default: Date.now},
	path: [
		{lat: Number, lng: Number}
		],
	locationTag: String
}, {
  usePushEach: true
});

module.exports = mongoose.model('tour', schema);
