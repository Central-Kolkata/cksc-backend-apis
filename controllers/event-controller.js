const asyncHandler = require("express-async-handler");
const Venue = require("../models/venue-model");
const Event = require("../models/event-model"); // Ensure you have an Event model similar to Venue
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
	const events = await Event.find();
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

module.exports =
{
	fetchVenues, createVenue, updateVenue, deleteVenue,
	fetchEvents, createEvent, updateEvent, deleteEvent
};
