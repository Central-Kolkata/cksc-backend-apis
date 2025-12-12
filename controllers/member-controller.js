const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Member = require("../models/member-model");
const EventRegistration = require("../models/event-registration-model");
const MemberPayment = require('../models/member-payment'); // Update the path according to your project structure
const ICICIPaymentRequest = require('../models/icici-payment-request');
const ICICIPaymentResponse = require('../models/icici-payment-response');
const axios = require("axios");
const jwt = require("jsonwebtoken");

const fetchMembers = asyncHandler(async (req, res) =>
{
	const members = await Member.find();

	res.status(200).json({ members });
});

const fetchActiveMembers = asyncHandler(async (req, res) =>
{
	const members = await Member.find({ status: 'active' });

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

const updateMultipleMembers = asyncHandler(async (req, res) =>
{
	const updates = req.body;

	const updatePromises = updates.map(async (update) =>
	{
		const { id, changes, deletion } = update;

		let updateFields = {};

		if (changes && changes.cksc)
		{
			updateFields.ckscMembershipNo = changes.cksc.newValue;
		}

		if (deletion)
		{
			updateFields.status = 'inactive';
		}

		return Member.findByIdAndUpdate(id, updateFields, { new: true });
	});

	const results = await Promise.all(updatePromises);

	res.status(200).json({ message: 'Members successfully updated!', results });
});

const updateEventRegistration = asyncHandler(async (req, res) =>
{
	const { memberId, eventId } = req.params;
	const
		{
			referredBy,
			remarks,
			paymentStatus,
			status,
			transactionRefNo,
			transactionAmount,
			currentPendingAmount,
			eventAmount,
			memberType,
		} = req.body;

	const updateFields = {};
	if (referredBy !== undefined)
	{
		updateFields.referredBy = referredBy;
	}

	if (remarks !== undefined)
	{
		updateFields.remarks = remarks;
	}

	if (paymentStatus !== undefined)
	{
		updateFields.paymentStatus = paymentStatus;
	}

	if (status !== undefined)
	{
		updateFields.status = status;
	}

	if (transactionRefNo !== undefined)
	{
		updateFields.transactionRefNo = transactionRefNo;
	}

	if (transactionAmount !== undefined)
	{
		updateFields.transactionAmount = transactionAmount;
	}

	if (currentPendingAmount !== undefined)
	{
		updateFields.currentPendingAmount = currentPendingAmount;
	}

	if (eventAmount !== undefined)
	{
		updateFields.eventAmount = eventAmount;
	}

	if (memberType !== undefined)
	{
		updateFields.memberType = memberType;
	}

	try
	{
		const updatedEventRegistration = await EventRegistration.findOneAndUpdate(
			{ memberId, eventId },
			updateFields,
			{ new: true, runValidators: true }
		);

		if (!updatedEventRegistration)
		{
			return res.status(404).json({ message: 'Event registration not found' });
		}

		res.status(200).json({ message: 'Event registration updated successfully', updatedEventRegistration });
	}
	catch (error)
	{
		res.status(500).json({ message: 'Failed to update event registration', error });
	}
});

const removeEventRegistration = asyncHandler(async (req, res) =>
{
	const { memberId, eventId } = req.params;
	const { remarks } = req.body;

	try
	{
		// Soft remove: set status to 'cancelled', store remarks if provided
		const updatedRegistration = await EventRegistration.findOneAndUpdate(
			{ memberId, eventId },
			{ status: "cancelled", deregistrationRemarks: remarks },
			{ new: true, runValidators: true }
		);

		if (!updatedRegistration)
		{
			return res.status(404).json({ message: "Event registration not found." });
		}

		return res.status(200).json({
			message: "Event registration removed successfully.",
			updatedRegistration,
		});
	} catch (error)
	{
		res.status(500).json({
			message: "Failed to remove event registration",
			error: error.message,
		});
	}
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
	const memberId = req.params.id;
	const member = await Member.findById(memberId);

	if (!member)
	{
		res.status(404).json({ message: "Member not found" });
		return;
	}

	member.status = "deleted";
	await member.save();

	res.status(200).json({ message: "Member Deleted Successfully" });
});

const checkCKSCMembershipNo = asyncHandler(async (req, res) =>
{
	try
	{
		const { ckscMembershipNo: ckscMembershipNo } = req.params;

		if (!ckscMembershipNo)
		{
			return res.status(400).json(
				{
					success: false,
					message: 'Please provide a CKSC membership number.',
				});
		}

		const member = await Member.findOne(
			{
				ckscMembershipNo: ckscMembershipNo,
				status: { $ne: 'deleted' },
			});

		if (!member)
		{
			return res.status(404).json(
				{
					success: false,
					message: 'No matching member found.',
				});
		}

		return res.status(200).json(
			{
				success: true,
				message: 'Member found!',
				member,
			});
	}
	catch (error)
	{
		console.error('Error checking membership number:', error);

		return res.status(500).json(
			{
				success: false,
				message: 'Unable to check membership number. Please try again.',
				error: error.toString(),
			});
	}
});

const checkICAIMembershipNo = asyncHandler(async (req, res) =>
{
	try
	{
		const { icaiMembershipNo: icaiMembershipNo } = req.params;

		if (!icaiMembershipNo)
		{
			return res.status(400).json(
				{
					success: false,
					message: 'Please provide a ICAI membership number.',
				});
		}

		const member = await Member.findOne(
			{
				icaiMembershipNo: icaiMembershipNo,
				status: { $ne: 'deleted' },
			});

		if (!member)
		{
			return res.status(404).json(
				{
					success: false,
					message: 'No matching member found.',
				});
		}

		return res.status(200).json(
			{
				success: true,
				message: 'Member found!',
				member,
			});
	}
	catch (error)
	{
		console.error('Error checking membership number:', error);

		return res.status(500).json(
			{
				success: false,
				message: 'Unable to check membership number. Please try again.',
				error: error.toString(),
			});
	}
});

const fetchPendingAmount = asyncHandler(async (req, res) =>
{
	let member;

	const query =
	{
		status: { $nin: ["deleted", "inactive"] },
	};

	if (req.params.icaiMembershipNo.length === 10)
	{
		query.mobile = req.params.icaiMembershipNo;
	}
	else
	{
		query.icaiMembershipNo = req.params.icaiMembershipNo;
	}

	// Step 1: Find a member with type 'member' or 'patron' or 'lifetime-member'
	member = await Member.findOne(
		{
			...query,
			type: { $in: ["member", "patron", "lifetime-member"] },
		});

	// Step 2: If not found, search for 'non-member' or 'new-member'
	if (!member)
	{
		member = await Member.findOne(
			{
				...query,
				type: { $in: ["non-member", "new-member"] },
			});
	}

	// Step 3: Handle case where no member is found
	if (!member)
	{
		return res.status(404).json(
			{
				message: "Sorry! Member not found or has been deleted.",
			});
	}

	// Step 4: Find event information if `eventIdForRegistration` is provided
	let event = null;

	if (req.params.eventIdForRegistration)
	{
		event = await EventRegistration.findOne(
			{
				eventId: req.params.eventIdForRegistration,
				memberId: member._id,
				status: "confirmed",
			});
	}

	// Generate JWT for the member
	const token = jwt.sign(
		{
			id: member._id,
			icaiMembershipNo: member.icaiMembershipNo,
			ckscMembershipNo: member.ckscMembershipNo
		},
		process.env.JWT_SECRET,
		{ expiresIn: "1h" }
	);

	// Respond with the member, event data, and token
	res.status(200).json(
		{
			message: "Data fetched successfully",
			response: member,
			event,
			token
		});
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
				referenceNo: String(payment.iciciPaymentRequestId.referenceNo),
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
	res.json("asdf");
});

module.exports =
{
	fetchMembers, fetchActiveMembers, checkCKSCMembershipNo, checkICAIMembershipNo, createMember, createMembers, fetchPendingAmount, updateMember, updateMultipleMembers, deleteMember,
	fetchRegisteredEvents, memberTransactions, asdf, replaceMembers, updateEventRegistration, removeEventRegistration
};
