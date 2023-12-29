const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
	{
		name:
		{
			type: String,
			required: [true, "Name is mandatory"]
		},
		icaiMembershipNo:
		{
			type: String,
			required: [true, "ICAI Membership Number is mandatory"]
		},
		ckscMembershipNo:
		{
			type: String
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
		},
		active:
		{
			type: Boolean
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("User", userSchema);
