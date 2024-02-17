const mongoose = require("mongoose");

const iciciPaymentRequestSchema = mongoose.Schema(
	{
		memberId:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member'
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
		ckscReferenceNo:
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
