const mongoose = require("mongoose");

const venueSchema = mongoose.Schema(
	{
		name:
		{
			type: String,
			required: [true, "Name is mandatory"]
		},
		address:
		{
			type: String,
			required: [true, "Address is mandatory"]
		},
		active:
		{
			type: Boolean
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("Venue", venueSchema);
