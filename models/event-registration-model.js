const mongoose = require("mongoose");

const eventRegistrationSchema = mongoose.Schema(
	{
		eventId:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Event',
			required: true
		},
		userId:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User', // Replace with your User model's name if different
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
		isPaymentRequired:
		{
			type: Boolean,
			default: false
		},
		transactionRefNo:
		{
			type: String
		},
		amount:
		{
			type: Number
		},
		paymentStatus:
		{
			type: String,
			enum: ['paid', 'unpaid', 'NA'],
			default: 'NA'
		},
		additionalNotes:
		{
			type: String
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
