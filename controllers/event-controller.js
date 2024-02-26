const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Venue = require("../models/venue-model");
const Event = require("../models/event-model");
const EventRegistration = require("../models/event-registration-model");
const MemberPayment = require("../models/member-payment");
const ICICIPaymentRequest = require("../models/icici-payment-request");
const ICICIPaymentResponse = require("../models/icici-payment-response");
const Member = require("../models/member-model");
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
	const { memberId, eventId, remarks, iciciReferenceNo } = req.body;
	let memberPayment;

	// Check if the member has already registered for this event
	const existingRegistration = await EventRegistration.findOne(
		{
			memberId: memberId,
			eventId: eventId,
			status: 'confirmed'
		});

	if (existingRegistration) 
	{
		return res.status(400).json({ message: "Member has already registered for this event." });
	}

	const paymentResponse = await ICICIPaymentResponse.findOne({ iciciReferenceNo });

	if (paymentResponse)
	{
		memberPayment = await MemberPayment.findOne({ iciciPaymentResponseId: paymentResponse._id });
	}

	const member = await Member.findById(memberId, "type");

	const registrationData =
	{
		...req.body,
		remarks,
		transactionAmount: paymentResponse?.transactionAmount,
		transactionRefNo: memberPayment?._id,
		memberType: member.type
	};

	// Proceed to create a new event registration
	await EventRegistration.create(registrationData);

	res.status(201).json({ message: "Event Registration Successful!" });
});

const fetchEventMembers = asyncHandler(async (req, res) =>
{
	const { eventId } = req.params;

	try
	{
		// Step 1: Fetch registrations with memberId populated
		const registrations = await EventRegistration.find({ eventId: eventId })
			.populate('memberId')
			.lean();

		if (!registrations || registrations.length === 0)
		{
			return res.status(404).json({ message: "No members found for this event." });
		}

		// Prepare the response array
		const memberDetailsWithRegistrationDate = [];

		// Step 2 & 3: Iterate and conditionally fetch MemberPayments
		for (const registration of registrations)
		{
			let amountPaid = '-'; // Default value
			let paymentRemarks = registration.additionalNotes || ''; // Use additionalNotes if available

			// Only proceed if ckscMembershipNo is null and transactionRefNo is a valid ObjectId
			if (!registration.memberId?.ckscMembershipNo && mongoose.Types.ObjectId.isValid(registration.transactionRefNo))
			{
				const memberPayment = await MemberPayment.findById(registration.transactionRefNo)
					.populate(
						{
							path: 'iciciPaymentRequestId',
							select: 'amount paymentRemarks' // Selecting amount and paymentRemarks
						})
					.lean();

				if (memberPayment && memberPayment.iciciPaymentRequestId)
				{
					amountPaid = memberPayment.iciciPaymentRequestId.amount || amountPaid;
					// Override paymentRemarks only if additionalNotes is not present
					if (!registration.additionalNotes && memberPayment.iciciPaymentRequestId.paymentRemarks)
					{
						paymentRemarks = memberPayment.iciciPaymentRequestId.paymentRemarks;
					}
				}
			}

			memberDetailsWithRegistrationDate.push(
				{
					...registration.memberId,
					registrationId: registration._id.toString(),
					amountPaid,
					paymentRemarks, // This now correctly reflects the logic you wanted
					additionalNotes: registration.additionalNotes || 'N/A',
					registrationDate: registration.registrationDate,
				});
		}

		res.status(200).json(memberDetailsWithRegistrationDate);
	}
	catch (error)
	{
		res.status(500).send(`Error fetching registrations: ${error.message}`);
	}
});


module.exports =
{
	fetchVenues, createVenue, updateVenue, deleteVenue,
	fetchEvents, createEvent, updateEvent, deleteEvent,
	register, fetchEventMembers, fetchUpcomingEvents
};
