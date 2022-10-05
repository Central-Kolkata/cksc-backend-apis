const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
	{
		name:
		{
			type: String,
			required: [true, "Name is mandatory"]
		},
		membershipNo:
		{
			type: String,
			required: [true, "Membership Number is mandatory"]
		},
		pendingAmount:
		{
			type: Number
		},
		mobile:
		{
			type: String
		},
		email:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("User", userSchema);
