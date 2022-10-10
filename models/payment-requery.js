const mongoose = require("mongoose");

const PaymentRequerySchema = mongoose.Schema(
	{
		loginId:
		{
			type: String
		},
		merchantId:
		{
			type: Number
		},
		merchantTransactionId:
		{
			type: String
		},
		amount:
		{
			type: Number
		},
		transactionDate:
		{
			type: String
		}
	});

module.exports = mongoose.model("PaymentRequery", PaymentRequerySchema);
