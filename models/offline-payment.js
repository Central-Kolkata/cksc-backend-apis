const mongoose = require("mongoose");

const offlinePaymentSchema = mongoose.Schema(
	{
		userId:
		{
			type: String
		},
		transactionId:
		{
			type: String
		},
		productId:
		{
			type: String
		},
		paymentType:
		{
			type: String,
			enum: ["Cash", "Cheque"]
		},
		chequeDetails:
		{
			type: Object,
			default: {
				payeeName: "",
				// date: "",
				chequeNo: "",
				bankName: "",
			}
		},
		amount:
		{
			type: Number
		},
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("OfflinePayment", offlinePaymentSchema);
