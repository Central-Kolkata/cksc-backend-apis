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
		registrationClosesOn:
		{
			type: Date
		},
		eventDuration:
		{
			type: Number
		},
		hasCPEHours:
		{
			type: Boolean
		},
		eventVenue:
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Venue'
		},
		freeForCKCAMember:
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
		},
		registeredMembers:
			[{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Member"
			}]
	},
	{
		timestamps: true
	});

module.exports = mongoose.model("Event", eventSchema);
