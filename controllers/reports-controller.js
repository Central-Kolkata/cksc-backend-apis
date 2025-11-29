const asyncHandler = require("express-async-handler");
const ICICIPaymentRequest = require("../models/icici-payment-request");
const ICICIPaymentResponse = require("../models/icici-payment-response");
const Member = require("../models/member-model");
const MemberPayment = require("../models/member-payment");

const fetchAllMembers = asyncHandler(async (req, res) =>
{
    const allMembers = await Member.find({});
    let serialNumber = 1; // Initialize serial number
    let tableHtml = `
        <style>
            table, th, td {
                font-family: 'Calibri', sans-serif; /* Set the font style to Calibri */
                border: 1px solid black;
                border-collapse: collapse;
            }
            th, td {
                padding: 5px;
                text-align: left;
            }
        </style>
        <table>
            <thead>
                <tr>
                    <th>S.N.</th>
                    <th>Name</th>
                    <th>ICAI Membership No</th>
                    <th>CKSC Membership No</th>
                    <th>Pending Amount</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const member of allMembers)
    {
        // Format createdAt and updatedAt to include time
        const formattedCreatedAt = member.createdAt.toISOString().replace('T', ' ').slice(0, 19);
        const formattedUpdatedAt = member.updatedAt.toISOString().replace('T', ' ').slice(0, 19);

        tableHtml += `
            <tr>
                <td>${serialNumber++}</td>
                <td>${member.name}</td>
                <td>${member.icaiMembershipNo}</td>
                <td>${member.ckscMembershipNo}</td>
                <td>${member.pendingAmount}</td>
                <td>${member.mobile}</td>
                <td>${member.email}</td>
                <td>${formattedCreatedAt}</td>
                <td>${formattedUpdatedAt}</td>
            </tr>
        `;
    }

    tableHtml += `</tbody></table>`;

    res.send(tableHtml);
});

const fetchAllPaymentDetails = asyncHandler(async (req, res) =>
{
    const paymentResponses = await ICICIPaymentResponse.find({ responseCode: "E000" });
    let allPayments = [];

    for (const paymentResponse of paymentResponses)
    {
        const paymentRequest = await ICICIPaymentRequest.findOne(
            {
                referenceNo: String(paymentResponse.ckscReferenceNo)
            });

        if (paymentRequest)
        {
            allPayments.push(
                {
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
        // Function to convert date string to a Date object
        const parseDate = (dateStr) =>
        {
            const parts = dateStr.split(/[- :]/);
            return new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5]);
        };

        // Convert transaction dates to Date objects for comparison
        const dateA = parseDate(a.transactionDate);
        const dateB = parseDate(b.transactionDate);

        // Compare dates first, in descending order
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;

        // If dates are equal, sort by paymentType
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

    // Calculate the grand total
    let grandTotal = allPayments.reduce((total, payment) => total + payment.amount, 0);

    // HTML for the grand total
    const grandTotalHtml = `<p style="font-family: 'Calibri', sans-serif; font-size: 18px; font-weight: bold;">Grand Total: ${grandTotal}</p>`;

    // Combine the grand total and the table
    const htmlContent = `
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
        ${grandTotalHtml}
        ${htmlTable}
    `;

    res.send(htmlContent);
});

const fetchAllPaymentDetailsJSON = asyncHandler(async (req, res) =>
{
    const iciciPaymentResponses = await ICICIPaymentResponse.find({ responseCode: "E000" });
    let allPaymentDetails = [];

    for (const paymentResponse of iciciPaymentResponses)
    {

        const iciciPaymentRequest = await ICICIPaymentRequest.find(
            {
                amount: 300,
                referenceNo: String(paymentResponse.ckscReferenceNo)
            });

        allPaymentDetails.push(
            {
                icaiMembershipNo: iciciPaymentRequest.icaiMembershipNo,
                name: iciciPaymentRequest.name,
                email: iciciPaymentRequest.email,
                mobile: iciciPaymentRequest.mobile,
                referenceNo: iciciPaymentRequest.referenceNo,
                iciciReferenceNo: paymentResponse.iciciReferenceNo,
                transactionDate: paymentResponse.transactionDate,
                paymentMode: paymentResponse.paymentMode
            });
    }

    res.json(allPaymentDetails);
});

module.exports =
{
    fetchAllMembers, fetchAllPaymentDetails
};
