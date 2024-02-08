const asyncHandler = require("express-async-handler");
const User = require("../models/user-model");
const EventRegistration = require("../models/event-registration-model");
const UserPayment = require('../models/user-payment'); // Update the path according to your project structure
const ICICIPaymentRequest = require('../models/icici-payment-request');
const ICICIPaymentResponse = require('../models/icici-payment-response');
const axios = require("axios");

const fetchUsers = asyncHandler(async (req, res) =>
{
	const users = await User.find();

	res.status(200).json({ users });
});

const createUser = asyncHandler(async (req, res) =>
{
	const user = await User.create(req.body);

	res.status(201).json({ user });
});

const createUsers = asyncHandler(async (req, res) =>
{
	await User.insertMany(req.body);

	res.status(201).json({ message: "User Created Successfully" });
});

const updateUser = asyncHandler(async (req, res) =>
{
	const user = await User.findByIdAndUpdate(req.params.id);

	if (!user)
	{
		res.status(400);
		throw new Error("User not found");
	}

	await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
	res.status(200).json({ message: "User details successfully updated!" });
});

const deleteUser = asyncHandler(async (req, res) =>
{
	const user = await User.findByIdAndUpdate(req.params.id);

	if (!user)
	{
		res.status(400);
		throw new Error("User not found");
	}

	await user.remove();

	res.status(200).json({ message: "User Deleted Successfully" });
});

const fetchPendingAmount = asyncHandler(async (req, res) =>
{
	const user = await User.findOne({ icaiMembershipNo: req.params.icaiMembershipNo });

	res.status(200).json(
		{
			message: "Data fetched Successfully",
			response: user
		}
	);
});

const fetchRegisteredEvents = asyncHandler(async (req, res) =>
{
	const userId = req.params.userId || req.user._id;

	const registeredEvents = await EventRegistration.find({ userId: userId })
		.populate('eventId'); // Ensure this matches the field name in your EventRegistration schema

	console.log("registeredEvents", registeredEvents);
	// Extract event details if needed
	const eventsDetails = registeredEvents.map(registration => registration.eventId);

	res.status(200).json({ events: eventsDetails });
});

const userTransactions = asyncHandler(async (req, res) =>
{
	try 
	{
		const userId = req.params.userId;

		// Find all user payments for the given user and populate specific fields
		const userPayments = await UserPayment.find({ userId: userId })
			.populate(
				{
					path: 'iciciPaymentRequestId',
					select: 'icaiMembershipNo ckscMembershipNo name email mobile amount referenceNo'
				})
			.populate(
				{
					path: 'iciciPaymentResponseId',
					select: 'transactionAmount transactionDate paymentMode'
				});

		// Format the response as needed
		const transactions = userPayments.map(payment =>
		{
			return {
				// Fields from UserPayment
				paymentStatus: payment.paymentStatus,
				// Fields from ICICIPaymentRequest
				referenceNo: payment.iciciPaymentRequestId.referenceNo,
				paymentDescription: payment.iciciPaymentRequestId.paymentDescription || 'NA',
				paymentRemarks: payment.iciciPaymentRequestId.paymentRemarks || 'NA',
				requestedAmount: payment.iciciPaymentRequestId.amount,
				paymentType: payment.iciciPaymentRequestId.paymentType || 'NA',
				// Fields from ICICIPaymentResponse
				iciciReferenceNo: payment.iciciPaymentResponseId.iciciReferenceNo,
				transactionDate: payment.iciciPaymentResponseId.transactionDate,
				paymentMode: payment.iciciPaymentResponseId.paymentMode,
				transactionAmount: payment.iciciPaymentResponseId.transactionAmount,
			};
		});

		res.status(200).json({ transactions });
	}
	catch (error) 
	{
		console.error('Error fetching user transactions:', error);
		res.status(500).json({ message: 'Error fetching user transactions' });
	}
});

const asdf = asyncHandler(async (req, res) =>
{
	try
	{
		// Update all users where pendingAmount is less than 0
		const updateResult = await User.updateMany(
			{ pendingAmount: { $lt: 0 } }, // Criteria: pendingAmount < 0
			{ $set: { pendingAmount: 0 } }  // Set pendingAmount to 0
		);

		// If you want to do something with updateResult (e.g., logging), you can do it here
		console.log(updateResult);

		res.status(200).json({ message: "Pending amounts updated successfully", updateResult });
	} catch (error)
	{
		console.error("Error updating pending amounts:", error);
		res.status(500).send(error.message);
	}
});

module.exports =
{
	fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser,
	fetchRegisteredEvents, userTransactions, asdf
};
