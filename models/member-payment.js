const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const memberPaymentSchema = mongoose.Schema(
	{
		memberId:
		{
			type: Schema.Types.ObjectId,
			ref: "Member"
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
			type: String,
			enum: ["paid", "unpaid", "pending"]
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("MemberPayment", memberPaymentSchema);
