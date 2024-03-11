const asyncHandler = require("express-async-handler");
const MemberPayment = require("../models/member-payment");
const moment = require('moment');

const fetchTransactions = asyncHandler(async (req, res) =>
{
	const { fromDate, toDate } = req.query;

	let query = {};

	if (fromDate || toDate)
	{
		let start = fromDate ? moment(fromDate).startOf('day') : moment(0);
		let end = toDate ? moment(toDate).endOf('day') : moment().endOf('day');

		query.createdAt = { $gte: start.toDate(), $lte: end.toDate() };
		query.paymentStatus = "paid";
	}

	const payments = await MemberPayment.find(query)
		.populate(
			{
				path: 'memberId',
				select: 'name icaiMembershipNo ckscMembershipNo mobile email',
			})
		.populate(
			{
				path: 'iciciPaymentRequestId',
				select: 'paymentType amount',
			})
		.populate(
			{
				path: 'iciciPaymentResponseId',
				select: 'totalAmount',
			})
		.sort({ createdAt: -1 });

	// Manually adjust the output to rename keys
	const modifiedPayments = payments.map(payment =>
	{
		const modifiedPayment = payment.toObject(); // Convert document to a plain JavaScript object

		if (modifiedPayment.updatedAt)
		{
			modifiedPayment.updatedAt = moment(modifiedPayment.updatedAt).format('DD-MMM-YY hh:mm:ss A');
		}

		modifiedPayment.member = modifiedPayment.memberId;
		delete modifiedPayment.memberId;

		modifiedPayment.iciciPaymentRequest = modifiedPayment.iciciPaymentRequestId;
		delete modifiedPayment.iciciPaymentRequestId;

		modifiedPayment.iciciPaymentResponse = modifiedPayment.iciciPaymentResponseId;
		delete modifiedPayment.iciciPaymentResponseId;

		return modifiedPayment;
	});

	res.send(modifiedPayments);
});

module.exports =
{
	fetchTransactions
};
