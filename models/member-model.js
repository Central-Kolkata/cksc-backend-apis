const mongoose = require("mongoose");
const validator = require("validator");

const memberSchema = mongoose.Schema(
	{
		name:
		{
			type: String,
			required: [true, "Name is mandatory"]
		},
		icaiMembershipNo:
		{
			type: String
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
		transactions:
			[{
				type: mongoose.Schema.Types.ObjectId,
				ref: "MemberPayment",
				default: []
			}],
		eventIds:
			[{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Event",
				default: []
			}],
		status:
		{
			type: String,
			enum: ['active', 'inactive', 'pending', 'deleted'],
			default: 'active'
		},
		type:
		{
			type: String,
			enum: ['member', 'non-member', 'patron', 'new-member'],
			default: 'member'
		}
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model("Member", memberSchema);
