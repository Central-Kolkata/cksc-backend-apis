const mongoose = require('mongoose');
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const ICICIPaymentRequest = require("../models/icici-payment-request");
const ICICIPaymentResponse = require("../models/icici-payment-response");
const EventRegistration = require("../models/event-registration-model");
const Member = require("../models/member-model");
const MemberPayment = require("../models/member-payment");
const Venue = require("../models/venue-model");
const { NotFoundError } = require("../middlewares/errors");
const jwt = require("jsonwebtoken");

const getNextCKSCMembershipNo = async () =>
{
	const result = await Member.aggregate(
		[
			{
				$match:
				{
					ckscMembershipNo: /^CKSC-/
				}
			},
			{
				$project:
				{
					numberPart:
					{
						$toInt: { $arrayElemAt: [{ $split: ["$ckscMembershipNo", "-"] }, 1] }
					}
				}
			},
			{
				$sort:
				{
					numberPart: -1
				}
			},
			{
				$limit: 1
			}
		]);

	const maxNumber = result.length > 0 ? result[0].numberPart : 0;

	return (`CKSC-${maxNumber + 1}`);
};

const fetchOneTimePaymentRequestURL = asyncHandler(async (req, res) => fetchPaymentRequest(req, res, true));
const fetchPaymentRequestURL = asyncHandler(async (req, res) => fetchPaymentRequest(req, res));

const receiveOneTimePaymentResponse = asyncHandler(async (req, res) => handlePaymentResponse(req, res, true));
const receivePaymentResponse = asyncHandler(async (req, res) => handlePaymentResponse(req, res));

const createNewMemberIfNeeded = async (isOneTimePayment, paymentType, name, icaiMembershipNo, mobile, email, referenceNo, amount = 0) =>
{
	if (paymentType === "MembershipTotal" || paymentType === "EventOnly")
	{
		paymentType = "Event";
	}

	if (isOneTimePayment && (paymentType === "New Member" || paymentType === "Event" || paymentType === "Annual Conference"))
	{
		return await handleNewMemberCreation(name, icaiMembershipNo, mobile, email, "", paymentType, amount);
	}

	return null;
};

// Function to handle new member creation
const handleNewMemberCreation = async (name, icaiMembershipNo, mobile, email, referenceNo, paymentType, amount = 0) =>
{
	const type = (paymentType === "Event" || paymentType === "Annual Conference") ? "non-member" : "member";

	const newMember = await Member.create(
		{
			name, icaiMembershipNo, ckscMembershipNo: referenceNo, pendingAmount: amount,
			mobile, email, active: true, type
		});

	return newMember;
};

// Unified function to handle both payment request scenarios
const fetchPaymentRequest = asyncHandler(async (req, res, isOneTimePayment = false) =>
{
	const request = req.body;
	const
		{
			memberId, icaiMembershipNo, ckscMembershipNo, name, email, mobile, address, pan,
			paymentType, remarks, amount, amountAfterWaiver, selectedEvent = ""
		} = request;

	// Generate unique reference number
	const referenceNo = generateEnhancedTimestampId();

	// Handle new member creation for one-time payments, if necessary
	const newMember = await createNewMemberIfNeeded(isOneTimePayment, paymentType, name, icaiMembershipNo, mobile, email, referenceNo, amount);
	const effectiveMemberId = newMember ? newMember.id : memberId;

	// Common ICICIPaymentRequest creation logic
	await ICICIPaymentRequest.create(
		{
			memberId: effectiveMemberId,
			icaiMembershipNo, name, email, mobile, address, pan,
			amount, amountAfterWaiver,
			ckscReferenceNo: referenceNo,
			paymentType,
			paymentDescription: isOneTimePayment ? selectedEvent : "",
			paymentRemarks: remarks,
			ckscMembershipNo
		});

	// In both the cases - with waiver or without waiver, the user will be paying `amountAfterWaiver` only.

	// Construct and send the payment URL
	const paymentURL = constructPaymentURL(referenceNo, amountAfterWaiver, name, mobile, address, pan, email,
		isOneTimePayment ? process.env.ICICI_ONETIME_RU : process.env.ICICI_RETURN_URL);

	res.json(paymentURL);
});

// Function to construct the payment URL
const constructPaymentURL = (referenceNo, amount, name, mobile, address, pan, email, returnUrl) =>
{
	const mandatoryFields = `${referenceNo}|${process.env.ICICI_SUB_MERCHANT_ID}|${amount}|${name}|${mobile}|${address}|${pan}|${email}`;

	const queryParams =
	{
		"merchantid": process.env.ICICI_MERCHANT_ID,
		"mandatory fields": encryptData(mandatoryFields),
		"optional fields": "",
		"returnurl": encryptData(`${process.env.BACKEND_BASE_URL}${returnUrl}`),
		"Reference No": encryptData(referenceNo),
		"submerchantid": encryptData(process.env.ICICI_SUB_MERCHANT_ID),
		"transaction amount": encryptData(amount),
		"paymode": encryptData(process.env.ICICI_PAYMODE)
	};

	const queryString = Object.entries(queryParams).map(([key, value]) => `${key}=${value}`).join("&");

	return `${process.env.ICICI_PAY_URL}${queryString}`;
};

const registerOneTimeMember = asyncHandler(async (req, res) =>
{
	const request = req.body;
	const {
		icaiMembershipNo, name, email, mobile, address, pan,
		paymentType, remarks, amount, selectedEvent
	} = request;

	const memberType = "non-member";

	// Generate unique reference number
	const newMember = await createNewMemberIfNeeded(true, paymentType, name, icaiMembershipNo, mobile, email, "", amount);

	// Check if newMember was successfully created
	if (!newMember)
	{
		// Handle the case where member creation failed
		return res.status(400).json({ message: "Failed to create new member" });
	}

	// Create event registration for the new member
	const eventRegistrationData =
	{
		eventId: selectedEvent, // Assuming this is the ObjectId of the event
		memberId: newMember._id, // Use _id for MongoDB ObjectId reference
		amount: amount,
		paymentStatus: 'unpaid', // Assuming the payment has not been completed yet
		remarks,
		memberType
	};

	if (request.transactionRefNo && mongoose.Types.ObjectId.isValid(request.transactionRefNo))
	{
		eventRegistrationData.transactionRefNo = request.transactionRefNo;
	}

	const eventRegistration = new EventRegistration(eventRegistrationData);
	await eventRegistration.save();

	const event = await Event.findById(selectedEvent);
	const member = await Member.findById(newMember._id);
	const venue = await Venue.findById(event.eventVenue);

	// Generate JWT for the new member
	const token = jwt.sign(
		{
			id: member._id,
			icaiMembershipNo: member.icaiMembershipNo,
			ckscMembershipNo: member.ckscMembershipNo
		},
		process.env.JWT_SECRET,
		{ expiresIn: "1h" }
	);

	// Send response back with event registration details and token
	res.status(201).json(
		{
			message: "Event Registration Successful!",
			event,
			member,
			venue,
			token
		});
});

const handlePaymentResponse = asyncHandler(async (req, res, isOneTimePayment = false) => 
{
	try 
	{
		const
			{
				body:
				{
					"Response Code": responseCode,
					"Unique Ref Number": iciciReferenceNo,
					"Service Tax Amount": serviceTaxAmount,
					"Processing Fee Amount": processingFeeAmount,
					"Total Amount": totalAmount,
					"Transaction Amount": transactionAmount,
					"Transaction Date": transactionDate,
					"Interchange Value": interchangeValue,
					"TDR": tdr,
					"Payment Mode": paymentMode,
					"SubMerchantId": submerchantId,
					"ReferenceNo": ckscReferenceNo,
					"ID": id,
					"RS": rs,
					"TPS": tps
				}
			} = req;

		const isPaymentSuccessful = responseCode === "E000";
		const iciciPaymentRequest = await ICICIPaymentRequest.find({ ckscReferenceNo: ckscReferenceNo });

		if (!iciciPaymentRequest || iciciPaymentRequest.length === 0) 
		{
			return res.status(404).json({ error: "Payment request not found" });
		}

		const dbAmount = iciciPaymentRequest[0].amountAfterWaiver;

		let paymentResponseDetails =
		{
			ckscReferenceNo,
			responseCode,
			iciciReferenceNo: isPaymentSuccessful ? iciciReferenceNo : undefined,
			serviceTaxAmount: isPaymentSuccessful ? serviceTaxAmount : undefined,
			processingFeeAmount: isPaymentSuccessful ? processingFeeAmount : undefined,
			totalAmount: isPaymentSuccessful ? totalAmount : undefined,
			transactionAmount: isPaymentSuccessful ? transactionAmount : undefined,
			transactionDate: isPaymentSuccessful ? transactionDate : undefined,
			interchangeValue,
			tdr,
			paymentMode,
			submerchantId,
			tps,
			id,
			rs
		};

		const iciciPaymentResponse = await ICICIPaymentResponse.create(paymentResponseDetails);

		if (isPaymentSuccessful)
		{
			if (isOneTimePayment == false && iciciPaymentRequest[0].paymentType != "Annual Conference" && iciciPaymentRequest[0].paymentType != "EventOnly")
			{
				await reduceThePendingAmount(dbAmount, iciciPaymentRequest[0].memberId);
			}
		}

		const memberPaymentResponseDetails =
		{
			memberId: iciciPaymentRequest[0].memberId,
			iciciPaymentRequestId: iciciPaymentRequest[0]._id,
			iciciPaymentResponseId: iciciPaymentResponse._id,
			paymentStatus: `${isPaymentSuccessful ? "paid" : "unpaid"}`
		};

		// Assuming MemberPayment.create function exists and is used to log/track member payment statuses
		const memberPaymentResponse = await MemberPayment.create(memberPaymentResponseDetails);

		// Redirect to a response page with a query string that encapsulates the result
		const queryString = buildQueryString(isPaymentSuccessful, responseCode, iciciPaymentRequest[0], memberPaymentResponse._id, paymentResponseDetails);

		if (iciciPaymentRequest[0].paymentType == "Annual Conference")
		{
			res.redirect(`${process.env.CKSC_BASE_URL}/annual-payment-response.html?${queryString}`);
		}
		else
		{
			res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
		}
	}
	catch (ex) 
	{
		console.error("Exception in handlePaymentResponse", ex);
		res.status(500).json({ error: ex.message });
	}
});

function buildQueryString(isPaymentSuccessful, responseCode, paymentRequest, paymentResponseId, details) 
{
	let baseQuery = `${isPaymentSuccessful}|${responseCode}|${getErrorDescription(responseCode)}`;

	if (isPaymentSuccessful) 
	{
		baseQuery += `|${paymentRequest.memberId}|${paymentRequest.icaiMembershipNo}|${paymentRequest.ckscMembershipNo}|${details.ckscReferenceNo}|${details.iciciReferenceNo}|${details.transactionDate}|${details.transactionAmount}|${details.paymentMode}|${responseCode}|${paymentRequest.name}|${paymentRequest.email}|${paymentRequest.mobile}|${paymentResponseId}|${paymentRequest.paymentType}|${paymentRequest.paymentDescription}|${paymentRequest.paymentRemarks}`;
	}

	return baseQuery;
}

function getErrorDescription(code) 
{
	const errorCodes =
	{
		"E000": "Received successful confirmation in real time for the transaction. Settlement process is initiated for the transaction.",
		"E001": "Unauthorized Payment Mode",
		"E002": "Unauthorized Key",
		"E003": "Unauthorized Packet",
		"E004": "Unauthorized Merchant",
		"E005": "Unauthorized Return URL",
		"E006": "Transaction is already paid",
		"E007": "Transaction Failed",
		"E008": "Failure from Third Party due to Technical Error",
		"E009": "Bill Already Expired",
		"E0031": "Mandatory fields coming from merchant are empty",
		"E0032": "Mandatory fields coming from database are empty",
		"E0033": "Payment mode coming from merchant is empty",
		"E0034": "PG Reference number coming from merchant is empty",
		"E0035": "Sub merchant id coming from merchant is empty",
		"E0036": "Transaction amount coming from merchant is empty",
		"E0037": "Payment mode coming from merchant is other than 0 to 9",
		"E0038": "Transaction amount coming from merchant is more than 9 digit length",
		"E0039": "Mandatory value Email in wrong format",
		"E00310": "Mandatory value mobile number in wrong format",
		"E00311": "Mandatory value amount in wrong format",
		"E00312": "Mandatory value Pan card in wrong format",
		"E00313": "Mandatory value Date in wrong format",
		"E00314": "Mandatory value String in wrong format",
		"E00315": "Optional value Email in wrong format",
		"E00316": "Optional value mobile number in wrong format",
		"E00317": "Optional value amount in wrong format",
		"E00318": "Optional value pan card number in wrong format",
		"E00319": "Optional value date in wrong format",
		"E00320": "Optional value string in wrong format",
		"E00321": "Request packet mandatory columns is not equal to mandatory columns set in enrolment or optional columns are not equal to optional columns length set in enrolment",
		"E00322": "Reference Number Blank",
		"E00323": "Mandatory Columns are Blank",
		"E00324": "Merchant Reference Number and Mandatory Columns are Blank",
		"E00325": "Merchant Reference Number Duplicate",
		"E00326": "Sub merchant id coming from merchant is non numeric",
		"E00327": "Cash Challan Generated",
		"E00328": "Cheque Challan Generated",
		"E00329": "NEFT Challan Generated",
		"E00330": "Transaction Amount and Mandatory Transaction Amount mismatch in Request URL",
		"E00331": "UPI Transaction Initiated Please Accept or Reject the Transaction",
		"E00332": "Challan Already Generated, Please re-initiate with unique reference number",
		"E00333": "Referer is null/invalid Referer",
		"E00334": "Mandatory Parameters Reference No and Request Reference No parameter values are not matched",
		"E00335": "Transaction Cancelled By Member",
		"E0801": "FAIL",
		"E0802": "Member Dropped",
		"E0803": "Canceled by member",
		"E0804": "Member Request arrived but card brand not supported",
		"E0805": "Checkout page rendered Card function not supported",
		"E0806": "Forwarded / Exceeds withdrawal amount limit",
		"E0807": "PG Fwd Fail / Issuer Authentication Server failure",
		"E0808": "Session expiry / Failed Initiate Check, Card BIN not present",
		"E0809": "Reversed / Expired Card",
		"E0810": "Unable to Authorize",
		"E0811": "Invalid Response Code or Guide received from Issuer",
		"E0812": "Do not honor",
		"E0813": "Invalid transaction",
		"E0814": "Not Matched with the entered amount"
	};

	return errorCodes[code] || 'Transaction Failed';
}

const reduceThePendingAmount = async (amountToReduce, memberId) =>
{
	const member = await Member.findById(memberId);

	if (!member)
	{
		throw new NotFoundError("Member not found");
	}

	member.pendingAmount -= amountToReduce;

	await member.save();
};

const encryptData = ((plainText, outputEncoding = "base64") =>
{
	const cipher = crypto.createCipheriv("aes-128-ecb", process.env.ICICI_AES_ENCRYPTION_KEY, null);
	return Buffer.concat([cipher.update(plainText), cipher.final()]).toString(outputEncoding);
});

const decryptData = ((cipherText, inputEncoding = "base64", outputEncoding = "utf8") =>
{
	const decipher = crypto.createDecipheriv("aes-128-ecb", process.env.ICICI_AES_ENCRYPTION_KEY, null);
	let decrypted = decipher.update(cipherText, inputEncoding, outputEncoding);
	decrypted += decipher.final(outputEncoding);

	return decrypted;
});

const generateEnhancedTimestampId = () =>
{
	const timestamp = Date.now();

	// Generating a random 4-digit number for added uniqueness
	const randomBits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

	return `${timestamp}${randomBits}`;
};

module.exports =
{
	fetchOneTimePaymentRequestURL, fetchPaymentRequestURL, receiveOneTimePaymentResponse, receivePaymentResponse, getNextCKSCMembershipNo, registerOneTimeMember
};
