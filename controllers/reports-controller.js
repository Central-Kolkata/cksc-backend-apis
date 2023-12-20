const asyncHandler = require("express-async-handler");
const ICICIPaymentRequest = require("../models/icici-payment-request");
const ICICIPaymentResponse = require("../models/icici-payment-response");
const User = require("../models/user-model");
const UserPayment = require("../models/user-payment");

const fetchAllPaymentDetails = asyncHandler(async (req, res) =>
{
	const paymentResponses = await ICICIPaymentResponse.find({ responseCode: "E000" });
	let allPayments = [];

	for (const paymentResponse of paymentResponses)
	{
		const paymentRequest = await ICICIPaymentRequest.findOne({
			referenceNo: paymentResponse.ckscReferenceNo
		});

		if (paymentRequest)
		{
			allPayments.push({
				icaiMembershipNo: paymentRequest.icaiMembershipNo,
				name: paymentRequest.name,
				email: paymentRequest.email,
				mobile: paymentRequest.mobile,
				amount: paymentRequest.amount,
				referenceNo: paymentRequest.referenceNo,
				iciciReferenceNo: paymentResponse.iciciReferenceNo,
				transactionDate: paymentResponse.transactionDate,
				paymentMode: paymentResponse.paymentMode,
				paymentType: paymentRequest.paymentType || 'NA',
				paymentDescription: paymentRequest.paymentDescription || 'NA',
				paymentRemarks: paymentRequest.paymentRemarks || 'NA'
			});
		}
	}

	// Sort the combined data
	allPayments.sort((a, b) =>
	{
		if (a.paymentType === b.paymentType)
		{
			return new Date(a.transactionDate) - new Date(b.transactionDate);
		}
		return a.paymentType.localeCompare(b.paymentType);
	});

	// Convert the sorted data into HTML table rows
	let tableRows = '';
	allPayments.forEach((payment, index) =>
	{
		tableRows += `
            <tr>
                <td>${index + 1}</td>
                <td>${payment.icaiMembershipNo}</td>
                <td>${payment.name}</td>
                <td>${payment.email}</td>
                <td>${payment.mobile}</td>
                <td>${payment.amount}</td>
                <td>${payment.referenceNo}</td>
                <td>${payment.iciciReferenceNo}</td>
                <td>${payment.transactionDate}</td>
                <td>${payment.paymentMode}</td>
                <td>${payment.paymentType}</td>
                <td>${payment.paymentDescription}</td>
                <td>${payment.paymentRemarks}</td>
            </tr>
        `;
	});

	const htmlTable = `
        <style>
            table, th, td {
                font-family: 'Calibri', sans-serif;
                border-collapse: collapse;
            }
            th, td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }
        </style>
        <table border="1">
            <thead>
                <tr>
                    <th>S.N.</th>
                    <th>ICAI Membership No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Amount</th>
                    <th>Reference No</th>
                    <th>ICICI Reference No</th>
                    <th>Transaction Date</th>
                    <th>Payment Mode</th>
                    <th>Payment Type</th>
                    <th>Payment Description</th>
                    <th>Payment Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;

	res.send(htmlTable);
});

const fetchAllPaymentDetailsJSON = asyncHandler(async (req, res) =>
{
	const paymentResponses = await ICICIPaymentResponse.find({ responseCode: "E000" });
	let allPaymentDetails = [];

	for (const paymentResponse of paymentResponses)
	{
		const paymentRequest = await ICICIPaymentRequest.find(
			{
				amount: 300,
				referenceNo: paymentResponse.ckscReferenceNo
			});

		allPaymentDetails.push(
			{
				icaiMembershipNo: paymentRequest.icaiMembershipNo,
				name: paymentRequest.name,
				email: paymentRequest.email,
				mobile: paymentRequest.mobile,
				referenceNo: paymentRequest.referenceNo,
				iciciReferenceNo: paymentResponse.iciciReferenceNo,
				transactionDate: paymentResponse.transactionDate,
				paymentMode: paymentResponse.paymentMode
			});
	}

	res.json(allPaymentDetails);
});


module.exports =
{
	fetchAllPaymentDetails
};
