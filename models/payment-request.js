const mongoose = require("mongoose");

const paymentRequestSchema = mongoose.Schema(
	{
		userId:
		{
			type: String
		},
		ckscMembershipNo:
		{
			type: String
		},
		productId:
		{
			type: String
		},
		transactionId:
		{
			type: String
		},
		amount:
		{
			type: Number
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
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("PaymentRequest", paymentRequestSchema);
