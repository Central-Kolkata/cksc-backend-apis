const mongoose = require("mongoose");
const validator = require("validator"); // npm install validator

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
			type: String,
			validate: [validator.isMobilePhone, "Please fill a valid mobile number"]
		},
		email:
		{
			type: String,
			validate: [validator.isEmail, "Please fill a valid email address"]
		},
		dob:
		{
			type: Date
		},
		dateOfAnniversary:
		{
			type: Date
		},
		spouseName:
		{
			type: String
		},
		status:
		{
			type: String,
			enum: ['active', 'inactive', 'deleted']
		},
		type:
		{
			type: String,
			enum: ['member', 'non-member', 'patron'],
			default: 'member'
		},
		remarks:
		{
			type: String
		}
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model("User", userSchema);
