const mongoose = require("mongoose");
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

const bulkUpdateuser = asyncHandler(async (req, res) =>
{

});

function standardizeCKSCNo(ckscNo)
{
	if (!ckscNo || !ckscNo.startsWith('CKSC-'))
	{
		return ckscNo;
	}

	const parts = ckscNo.split('-');

	if (parts.length !== 2)
	{
		return ckscNo;
	}

	const numericPart = parts[1].padStart(4, '0');
	return `CKSC-${numericPart}`;
}

const replaceUsers = asyncHandler(async (req, res) =>
{
	const usersData = req.body;

	for (const userData of usersData)
	{
		const { name, icaiMembershipNo } = userData;
		let { ckscMembershipNo } = userData;

		ckscMembershipNo = standardizeCKSCNo(ckscMembershipNo);

		const user = await User.findOne(
			{
				icaiMembershipNo,
				$or:
					[
						{ ckscMembershipNo }, { ckscMembershipNo: userData["CKSC Membership No"] }
					]
			}
		);

		if (user)
		{
			Object.assign(user, userData, { ckscMembershipNo });
			await user.save();
		}
		else
		{
			const newUser = new User({ ...userData, ckscMembershipNo });
			await newUser.save();
		}
	}

	res.status(200).json({ message: 'Users data processed successfully' });

	// try
	// {
	// 	// Option 1: Remove all existing documents and insert the new data
	// 	await User.deleteMany({}); // Use with caution!

	// 	const insertedUsers = await User.insertMany(usersData);

	// 	res.status(200).json({ message: "Operation successful!", insertedUsers });
	// }
	// catch (error)
	// {
	// 	res.status(400).json({ message: "Error replacing users", error: error.message });
	// }
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
	const eventId = "65c3ce1d3566840ec78fea40";

	try
	{
		// Fetch the updated registrations
		const updatedRegistrations = await EventRegistration.find({ eventId: mongoose.Types.ObjectId(eventId) })
			.populate('userId')
			.lean();

		let i = 1;
		// Begin HTML table
		let html = '<table border="1"><tr><th>S.N.</th><th>Registration ID</th><th>User ID</th><th>Amount</th><th>Payment Status</th><th>Txn Ref No</th><th>Name</th><th>ICAI Membership No</th><th>CKSC Membership No</th><th>Mobile</th><th>Email</th><th>Remarks</th><th>Additional Notes</th></tr>';

		// Loop over each updated registration and add a row to the HTML table
		updatedRegistrations.forEach((registration) =>
		{
			if (!registration.userId)
			{
				console.log(`Skipping registration with ID: ${registration._id} because userId is null`);
				return;
			}

			html += `<tr>
				<td>${i++}</td>
                <td>${registration._id}</td>
                <td>${registration.userId._id}</td>
                <td>${registration.amount || 'N/A'}</td>
                <td>${registration.paymentStatus}</td>
                <td>${registration.transactionRefNo}</td>
                <td>${registration.userId.name}</td>
                <td>${registration.userId.icaiMembershipNo}</td>
                <td>${registration.userId.ckscMembershipNo || 'N/A'}</td>
                <td>${registration.userId.mobile}</td>
                <td>${registration.userId.email}</td>
                <td>${registration.userId.remarks || 'N/A'}</td>
                <td>${registration.additionalNotes || 'N/A'}</td>
            </tr>`;
		});

		// End HTML table
		html += '</table>';

		// Send HTML response
		res.send(html);
	} catch (error)
	{
		res.status(500).send(`Error fetching registrations: ${error.message}`);
	}
});

module.exports =
{
	fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser,
	fetchRegisteredEvents, userTransactions, asdf, replaceUsers
};
