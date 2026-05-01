const mongoose = require("mongoose");

const emailLogSchema = mongoose.Schema(
	{
		recipientEmail:
		{
			type: String,
			required: true
		},
		recipientName:
		{
			type: String
		},
		subject:
		{
			type: String
		},
		emailType:
		{
			type: String,
			enum: ['birthday', 'anniversary', 'welcome', 'other'],
			default: 'other'
		},
		serviceUsed:
		{
			type: String,
			enum: ['resend', 'brevo', 'none'],
			default: 'none'
		},
		status:
		{
			type: String,
			enum: ['sent', 'failed'],
			default: 'sent'
		},
		error:
		{
			type: String
		}
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model("EmailLog", emailLogSchema);
