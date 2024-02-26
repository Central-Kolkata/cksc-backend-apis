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
		eventEndDate:
		{
			type: Date
		},
		registrationEndTime:
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
		}
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("Event", eventSchema);
