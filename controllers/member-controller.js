const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Member = require("../models/member-model");
const EventRegistration = require("../models/event-registration-model");
const MemberPayment = require('../models/member-payment'); // Update the path according to your project structure
const ICICIPaymentRequest = require('../models/icici-payment-request');
const ICICIPaymentResponse = require('../models/icici-payment-response');
const axios = require("axios");

const fetchMembers = asyncHandler(async (req, res) =>
{
	const members = await Member.find();

	res.status(200).json({ members });
});

const createMember = asyncHandler(async (req, res) =>
{
	const member = await Member.create(req.body);

	res.status(201).json({ member });
});

const createMembers = asyncHandler(async (req, res) =>
{
	await Member.insertMany(req.body);

	res.status(201).json({ message: "Member Created Successfully" });
});

const updateMember = asyncHandler(async (req, res) =>
{
	const member = await Member.findByIdAndUpdate(req.params.id);

	if (!member)
	{
		res.status(400);
		throw new Error("Member not found");
	}

	await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
	res.status(200).json({ message: "Member details successfully updated!" });
});

const bulkUpdateMembers = asyncHandler(async (req, res) =>
{

});

const standardizeCKSCNo = (ckscNo) =>
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
};

const replaceMembers = asyncHandler(async (req, res) =>
{
	const membersData = req.body;

	for (const memberData of membersData)
	{
		const { name, icaiMembershipNo } = memberData;
		let { ckscMembershipNo } = memberData;

		ckscMembershipNo = standardizeCKSCNo(ckscMembershipNo);

		const member = await Member.findOne(
			{
				icaiMembershipNo,
				$or:
					[
						{ ckscMembershipNo }, { ckscMembershipNo: memberData["CKSC Membership No"] }
					]
			}
		);

		if (member)
		{
			Object.assign(member, memberData, { ckscMembershipNo });
			await member.save();
		}
		else
		{
			const newMember = new Member({ ...memberData, ckscMembershipNo });
			await newMember.save();
		}
	}

	res.status(200).json({ message: 'Members data processed successfully' });
});

const deleteMember = asyncHandler(async (req, res) =>
{
	const member = await Member.findByIdAndUpdate(req.params.id);

	if (!member)
	{
		res.status(400);
		throw new Error("Member not found");
	}

	await member.remove(); // TODO: add the del flag

	res.status(200).json({ message: "Member Deleted Successfully" });
});

const fetchPendingAmount = asyncHandler(async (req, res) =>
{
	const member = await Member.findOne({ icaiMembershipNo: req.params.icaiMembershipNo });

	res.status(200).json(
		{
			message: "Data fetched Successfully",
			response: member
		}
	);
});

const fetchRegisteredEvents = asyncHandler(async (req, res) =>
{
	const memberId = req.params.memberId || req.member._id;

	const registeredEvents = await EventRegistration.find({ memberId: memberId })
		.populate('eventId');

	const eventsDetails = registeredEvents.map(registration => registration.eventId);

	res.status(200).json({ events: eventsDetails });
});

const memberTransactions = asyncHandler(async (req, res) =>
{
	try 
	{
		const memberId = req.params.memberId;

		// Find all member payments for the given member and populate specific fields
		const memberPayments = await MemberPayment.find({ memberId: memberId })
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
		const transactions = memberPayments.map(payment =>
		{
			return {
				// Fields from MemberPayment
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
		console.error('Error fetching member transactions:', error);
		res.status(500).json({ message: 'Error fetching member transactions' });
	}
});

const asdf = asyncHandler(async (req, res) =>
{
	res.send("asdf");
});

module.exports =
{
	fetchMembers: fetchMembers, createMember, createMembers, fetchPendingAmount, updateMember, deleteMember,
	fetchRegisteredEvents, memberTransactions, asdf, replaceMembers
};
