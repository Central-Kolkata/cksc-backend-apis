const asyncHandler = require("express-async-handler");
const MemberPayment = require("../models/member-payment");
const moment = require('moment');

const fetchTransactions = asyncHandler(async (req, res) =>
{
	const { fromDate, toDate } = req.query;

	let matchStage = { paymentStatus: "paid" };

	if (fromDate || toDate)
	{
		let start = fromDate ? moment(fromDate).startOf('day') : moment(0);
		let end = toDate ? moment(toDate).endOf('day') : moment().endOf('day');

		matchStage.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
	}

	let payments = await MemberPayment.aggregate(
		[
			{
				$match: matchStage
			},
			{
				$lookup:
				{
					from: "members",
					localField: "memberId",
					foreignField: "_id",
					as: "member"
				}
			},
			{
				$lookup:
				{
					from: "icicipaymentrequests",
					localField: "iciciPaymentRequestId",
					foreignField: "_id",
					as: "iciciPaymentRequest"
				}
			},
			{
				$lookup:
				{
					from: "icicipaymentresponses",
					localField: "iciciPaymentResponseId",
					foreignField: "_id",
					as: "iciciPaymentResponse"
				}
			},
			{
				$addFields:
				{
					iciciPaymentRequest: { $arrayElemAt: ["$iciciPaymentRequest", 0] },
					iciciPaymentResponse: { $arrayElemAt: ["$iciciPaymentResponse", 0] },
				}
			},
			{
				$match:
				{
					"iciciPaymentRequest.amount": { $exists: true },
					"iciciPaymentResponse.transactionAmount": { $exists: true },
					$expr: { $eq: ["$iciciPaymentRequest.amount", "$iciciPaymentResponse.transactionAmount"] }
				}
			},
			{
				$project:
				{
					member: 1,
					iciciPaymentRequest: { paymentType: 1, amount: 1 },
					iciciPaymentResponse: { transactionAmount: 1 },
					paymentStatus: 1,
					createdAt: 1,
					updatedAt: 1
				}
			}
		]);

	// Format updatedAt in each document and rename keys as needed
	const modifiedPayments = payments.map(payment =>
	{
		if (payment.updatedAt)
		{
			payment.updatedAt = moment(payment.updatedAt).format('DD-MMM-YY hh:mm:ss A');
		}

		// Flatten member, iciciPaymentRequest, and iciciPaymentResponse arrays if needed
		payment.member = payment.member[0] ? payment.member[0] : {};
		// No need to flatten iciciPaymentRequest and iciciPaymentResponse since it's done in $addFields

		return payment;
	});

	res.send(modifiedPayments);
});

module.exports =
{
	fetchTransactions
};
