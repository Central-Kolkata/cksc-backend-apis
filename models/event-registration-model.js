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
		referredBy:
		{
			type: String,
			default: ""
		},
		memberType:
		{
			type: String,
			enum: ['member', 'non-member', 'patron', 'lifetime-member'],
			default: 'member'
		},
		paymentStatus:
		{
			type: String,
			enum: ['paid', 'unpaid', 'pending', 'not-needed'],
			default: 'pending'
		},
		remarks:
		{
			type: String
		},
		deregistrationRemarks:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
