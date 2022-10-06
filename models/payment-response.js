const mongoose = require("mongoose");

const paymentResponseSchema = mongoose.Schema(
	{
		userId:
		{
			type: String
		},
		transactionId:
		{
			type: String
		},
		transactionTimestamp:
		{
			type: String
		},
		cardNumber:
		{
			type: String
		},
		surcharge:
		{
			type: Number
		},
		scheme:
		{
			type: String
		},
		signature:
		{
			type: String
		},
		amount:
		{
			type: Number
		},
		merchantTransaction:
		{
			type: String
		},
		fCode:
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
		udf11:
		{
			type: String
		},
		udf12:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("PaymentResponse", paymentResponseSchema);
