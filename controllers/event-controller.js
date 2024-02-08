const asyncHandler = require("express-async-handler");
const Venue = require("../models/venue-model");
const Event = require("../models/event-model");
const EventRegistration = require("../models/event-registration-model");
const User = require("../models/user-model");
const axios = require("axios");

const fetchVenues = asyncHandler(async (req, res) =>
{
	const venues = await Venue.find();

	res.status(200).json({ venues });
});

const createVenue = asyncHandler(async (req, res) =>
{
	const venue = await Venue.create(req.body);

	res.status(201).json({ message: "Venue Created Successfully!" });
});

const updateVenue = asyncHandler(async (req, res) =>
{
	const venue = await Venue.findByIdAndUpdate(req.params.id);

	if (!venue)
	{
		res.status(400);
		throw new Error("Venue not found");
	}

	await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
	res.status(200).json({ message: "Venue Updated Successfully!" });
});

const deleteVenue = asyncHandler(async (req, res) =>
{
	const venue = await Venue.findByIdAndUpdate(req.params.id);

	if (!venue)
	{
		res.status(400);
		throw new Error("Venue not found");
	}

	await venue.remove();

	res.status(200).json({ message: "Venue Deleted Successfully!" });
});

// Fetch all events
const fetchEvents = asyncHandler(async (req, res) =>
{
	const events = await Event.find().sort({ 'eventStartDate': -1 });
	res.status(200).json({ events });
});

const fetchUpcomingEvents = asyncHandler(async (req, res) =>
{
	// Get today's date at the start of the day (00:00:00)
	const today = new Date();
	today.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0

	const events = await Event.find({ eventStartDate: { $gte: today } })
		.sort({ 'eventStartDate': 1 }); // Sort by eventStartDate ascending

	res.status(200).json({ events });
});

// Create a new event
const createEvent = asyncHandler(async (req, res) =>
{
	const event = await Event.create(req.body);
	res.status(201).json({ message: "Event Created Successfully!" });
});

// Update an event
const updateEvent = asyncHandler(async (req, res) =>
{
	const event = await Event.findById(req.params.id);
	if (!event)
	{
		res.status(400);
		throw new Error("Event not found");
	}
	await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
	res.status(200).json({ message: "Event Updated Successfully!" });
});

// Delete an event
const deleteEvent = asyncHandler(async (req, res) =>
{
	const event = await Event.findById(req.params.id);

	if (!event)
	{
		res.status(400);
		throw new Error("Event not found");
	}

	await event.remove();

	res.status(200).json({ message: "Event Deleted Successfully!" });
});

const register = asyncHandler(async (req, res) =>
{
	const { userId, eventId } = req.body;

	// Check if the user has already registered for this event
	const existingRegistration = await EventRegistration.findOne(
		{
			userId: userId,
			eventId: eventId,
			status: 'confirmed'
		});

	if (existingRegistration) 
	{
		return res.status(400).json({ message: "User has already registered for this event." });
	}

	// Proceed to create a new event registration
	await EventRegistration.create(req.body);

	res.status(201).json({ message: "Event Registration Successful!" });
});

const fetchEventUsers = asyncHandler(async (req, res) =>
{
	const { eventId } = req.params;

	const registrations = await EventRegistration.find({ eventId: eventId }).populate('userId');

	if (!registrations || registrations.length === 0)
	{
		return res.status(404).json({ message: "No users found for this event." });
	}

	const userDetailsWithRegistrationDate = [];

	registrations.forEach((registration, index) =>
	{
		if (!registration.userId)
		{
			// Log the registration ID and index for further investigation
			console.log(`Missing userId at index ${index} with registration ID: ${registration._id}`);
		} else
		{
			const { name, icaiMembershipNo, mobile, email, ckscMembershipNo } = registration.userId;
			userDetailsWithRegistrationDate.push({
				name,
				icaiMembershipNo,
				mobile,
				email,
				ckscMembershipNo,
				registrationDate: registration.registrationDate
			});
		}
	});

	res.status(200).json(userDetailsWithRegistrationDate);
});

module.exports =
{
	fetchVenues, createVenue, updateVenue, deleteVenue,
	fetchEvents, createEvent, updateEvent, deleteEvent,
	register, fetchEventUsers, fetchUpcomingEvents
};
