const asyncHandler = require("express-async-handler");
const MemberPayment = require("../models/member-payment");
const moment = require('moment');

const fetchTransactions = asyncHandler(async (req, res) =>
{
	const { fromDate, toDate } = req.query;
	let dateFilter = {};

	if (fromDate || toDate)
	{
		// Use ISO date format and handle dates as UTC
		const start = fromDate ? new Date(fromDate) : new Date(0);
		const end = toDate ? new Date(toDate) : new Date();
		dateFilter =
		{
			createdAt: { $gte: start, $lte: end }
		};
		console.log("Using date filter:", dateFilter.createdAt.$gte.toISOString(), dateFilter.createdAt.$lte.toISOString());
	}

	try
	{
		let payments = await MemberPayment.aggregate(
			[
				{ $match: { paymentStatus: "paid", ...dateFilter } },
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
					$unwind:
					{
						path: "$member",
						preserveNullAndEmptyArrays: false  // Ensures that the pipeline continues only if member exists
					}
				},
				{ $match: { "member.status": "active" } },
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
						iciciPaymentResponse: { $arrayElemAt: ["$iciciPaymentResponse", 0] }
					}
				},
				{
					$project:
					{
						"member.name": 1,
						"member.email": 1,
						"member.mobile": 1,
						"member.ckscMembershipNo": 1,
						"member.icaiMembershipNo": 1,
						"iciciPaymentRequest.paymentType": 1,
						"iciciPaymentRequest.amount": 1,
						"updatedAt": 1
					}
				}
			]);

		console.log("Payments found:", payments.length);
		payments = payments.map(payment =>
		{
			payment.updatedAt = payment.updatedAt ? moment(payment.updatedAt).toISOString() : "";
			return payment;
		});

		res.send(payments);
	}
	catch (error)
	{
		console.error("Error in aggregation pipeline:", error);
		res.status(500).send("Failed to fetch payments due to server error.");
	}
});

module.exports =
{
	fetchTransactions
};
