const mongoose = require("mongoose");

const iciciPaymentRequestSchema = mongoose.Schema(
	{
		userId:
		{
			type: String
		},
		icaiMembershipNo:
		{
			type: String
		},
		ckscMembershipNo:
		{
			type: String
		},
		name:
		{
			type: String
		},
		email:
		{
			type: String
		},
		mobile:
		{
			type: String
		},
		address:
		{
			type: String
		},
		pan:
		{
			type: String
		},
		amount:
		{
			type: Number
		},
		referenceNo:
		{
			type: Number
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("ICICIPaymentRequest", iciciPaymentRequestSchema);
