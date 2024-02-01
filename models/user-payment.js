const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userPaymentSchema = mongoose.Schema(
	{
		userId:
		{
			type: Schema.Types.ObjectId,
			ref: "User"
		},
		paymentRequestId:
		{
			type: Schema.Types.ObjectId,
			ref: "PaymentRequest"
		},
		paymentResponseId:
		{
			type: Schema.Types.ObjectId,
			ref: "PaymentResponse"
		},
		iciciPaymentRequestId:
		{
			type: Schema.Types.ObjectId,
			ref: "ICICIPaymentRequest"
		},
		iciciPaymentResponseId:
		{
			type: Schema.Types.ObjectId,
			ref: "ICICIPaymentResponse"
		},

		paymentStatus:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("UserPayment", userPaymentSchema);
