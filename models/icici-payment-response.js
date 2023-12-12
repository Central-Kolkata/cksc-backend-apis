const mongoose = require("mongoose");

const iciciPaymentResponseSchema = mongoose.Schema(
	{
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
		bankTransactionReference:
		{
			type: String
		},
		ipgTransactionId:
		{
			type: String
		},
		bankName:
		{
			type: String
		},
		mmpTransaction:
		{
			type: String
		},
		discriminator:
		{
			type: String
		},
		authCode:
		{
			type: String
		},
		description:
		{
			type: String
		},
		transactionMessage:
		{
			type: String
		},
		udf1:
		{
			type: String
		},
		udf2:
		{
			type: String
		},
		udf3:
		{
			type: String
		},
		udf4:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("PaymentResponse", paymentResponseSchema);
