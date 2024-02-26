const mongoose = require("mongoose");

const iciciPaymentResponseSchema = mongoose.Schema(
	{
		iciciPaymentRequestId:
		{
			type: mongoose.Schema.Types.ObjectId
		},
		ckscReferenceNo:
		{
			type: String
		},
		responseCode:
		{
			type: String
		},
		iciciReferenceNo:
		{
			type: String
		},
		serviceTaxAmount:
		{
			type: String
		},
		processingFeeAmount:
		{
			type: String
		},
		totalAmount:
		{
			type: Number
		},
		transactionAmount:
		{
			type: String
		},
		transactionDate:
		{
			type: String
		},
		interchangeValue:
		{
			type: Number
		},
		tdr:
		{
			type: String
		},
		paymentMode:
		{
			type: String
		},
		submerchantId:
		{
			type: String
		},
		tps:
		{
			type: String
		},
		id:
		{
			type: String
		},
		rs:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("ICICIPaymentResponse", iciciPaymentResponseSchema);
