const mongoose = require("mongoose");

const eventSchema = mongoose.Schema(
	{
		eventName:
		{
			type: String
		},
		eventStartDate:
		{
			type: Date
		},
		eventStartTime:
		{
			type: Date
		},
		eventEndDate:
		{
			type: Date
		},
		registrationEndDateTime:
		{
			type: Date
		},
		eventDuration:
		{
			type: Number
		},
		eventVenue:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Venue'
		},
		freeEventForCKCA:
		{
			type: Boolean,
			default: true
		},
		isAnnualConference:
		{
			type: Boolean,
			default: false
		},
		eventAmount:
		{
			type: Number
		},
		eventMaxParticipants:
		{
			type: Number
		},
		eventTopics:
		{
			type: [String]
		},
		eventSpeakers:
		{
			type: [String]
		},
		eventEmailNotes:
		{
			type: String
		},
		earlyBirdDate:
		{
			type: Date
		},
		attachmentURL:
		{
			type: [String]
		},
		attachmentName:
		{
			type: [String]
		},
		contactPerson1Name:
		{
			type: String,
		},
		contactPerson1Mobile:
		{
			type: String,
		},
		contactPerson2Name:
		{
			type: String,
		},
		contactPerson2Mobile:
		{
			type: String,
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("Event", eventSchema);
