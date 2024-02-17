const mongoose = require("mongoose");

const eventRegistrationSchema = mongoose.Schema(
	{
		eventId:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Event',
			required: true
		},
		memberId:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Member',
			required: true
		},
		registrationDate:
		{
			type: Date,
			default: Date.now
		},
		status:
		{
			type: String,
			enum: ['pending', 'confirmed', 'cancelled'],
			default: 'confirmed'
		},
		transactionRefNo:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'MemberPayment',
			required: false
		},
		transactionAmount:
		{
			type: Number,
			required: false
		},
		eventAmount:
		{
			type: Number
		},
		currentPendingAmount:
		{
			type: Number
		},
		paymentStatus:
		{
			type: String,
			enum: ['paid', 'unpaid', 'NA'],
			default: 'NA'
		},
		remarks:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
