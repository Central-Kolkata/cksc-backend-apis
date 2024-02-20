const mongoose = require("mongoose");

const iciciPaymentRequestSchema = mongoose.Schema(
	{
		userId:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
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
		},
		paymentType:
		{
			type: String
		},
		paymentDescription:
		{
			type: String
		},
		paymentRemarks:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("ICICIPaymentRequest", iciciPaymentRequestSchema);
