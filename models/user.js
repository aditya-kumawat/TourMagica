var mongoose = require('mongoose');

var schema = new mongoose.Schema({
	mobileNo: {type: Number, index: { unique: true }},
	otp: {type: Number, default: "1234"}
});

module.exports = mongoose.model('user', schema);