const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const ICICIPaymentRequest = require("../models/icici-payment-request");
const ICICIPaymentResponse = require("../models/icici-payment-response");
const User = require("../models/user-model");
const UserPayment = require("../models/user-payment");

const fetchOneTimePaymentRequestURL = asyncHandler(async (req, res) =>
{
	var request = req.body;

	let icaiMembershipNo = request.icaiMembershipNo;

	let name = request.name;
	let email = request.email;
	let mobile = request.mobile;
	let address = request.address;
	let pan = request.pan;

	let paymentType = request.paymentType;
	let selectedEvent = request.selectedEvent;
	let remarks = request.remarks;

	let amount = request.amount;
	let referenceNo = generateEnhancedTimestampId(); // Will be used for reverifying a transaction

	if (paymentType == "New Member")
	{
		await User.create(
			{
				"name": name,
				"icaiMembershipNo": icaiMembershipNo,
				"ckscMembershipNo": "CKSC",
				"pendingAmount": 0,
				"mobile": mobile,
				"email": email
			});
	}

	await ICICIPaymentRequest.create(
		{
			"userId": icaiMembershipNo,
			"icaiMembershipNo": icaiMembershipNo,
			"ckscMembershipNo": "",
			"name": name,
			"email": email,
			"mobile": mobile,
			"address": address,
			"pan": pan,
			"amount": amount,
			"referenceNo": referenceNo,
			"paymentType": paymentType,
			"paymentDescription": selectedEvent,
			"paymentRemarks": remarks
		});

	let mandatoryFields = `${referenceNo}|${process.env.ICICI_SUB_MERCHANT_ID}|${amount}|${name}|${mobile}|${address}|${pan}|${email}`;

	const queryParams1 =
	{
		"merchantid": process.env.ICICI_MERCHANT_ID,
		"mandatory fields": mandatoryFields,
		"optional fields": "",
		"returnurl": `${process.env.BACKEND_BASE_URL}${process.env.ICICI_ONETIME_RU}`,
		"Reference No": referenceNo,
		"submerchantid": process.env.ICICI_SUB_MERCHANT_ID,
		"transaction amount": amount,
		"paymode": process.env.ICICI_PAYMODE
	};

	const queryString1 = Object.entries(queryParams1)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");

	const paymentURL1 = `${process.env.ICICI_PAY_URL}${queryString1}`;

	console.log("plaintextURL", paymentURL1);

	const queryParams =
	{
		"merchantid": process.env.ICICI_MERCHANT_ID,
		"mandatory fields": encryptData(mandatoryFields),
		"optional fields": "",
		"returnurl": encryptData(`${process.env.BACKEND_BASE_URL}${process.env.ICICI_ONETIME_RU}`),
		"Reference No": encryptData(referenceNo),
		"submerchantid": encryptData(process.env.ICICI_SUB_MERCHANT_ID),
		"transaction amount": encryptData(amount),
		"paymode": encryptData(process.env.ICICI_PAYMODE)
	};

	const queryString = Object.entries(queryParams)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");

	const paymentURL = `${process.env.ICICI_PAY_URL}${queryString}`;
	res.json(paymentURL);
});

const fetchPaymentRequestURL = asyncHandler(async (req, res) =>
{
	var request = req.body;

	let userId = request.userId;
	let icaiMembershipNo = request.icaiMembershipNo;
	let ckscMembershipNo = request.ckscMembershipNo;

	let name = request.name;
	let email = request.email;
	let mobile = request.mobile;
	let address = request.address;
	let pan = request.pan;

	let paymentType = request.paymentType;
	let remarks = request.remarks;

	let amount = request.amount;
	let referenceNo = generateEnhancedTimestampId(); // Will be used for reverifying a transaction

	let user = await User.findById(userId);

	if (user)
	{
		let isModified = false;

		if (user.email !== email)
		{
			user.email = email;
			isModified = true;
		}

		if (user.mobile !== mobile)
		{
			user.mobile = mobile;
			isModified = true;
		}

		if (isModified)
		{
			await user.save();
		}
	}

	await ICICIPaymentRequest.create(
		{
			"userId": userId,
			"icaiMembershipNo": icaiMembershipNo,
			"ckscMembershipNo": ckscMembershipNo,
			"name": name,
			"email": email,
			"mobile": mobile,
			"address": address,
			"pan": pan,
			"amount": amount,
			"referenceNo": referenceNo,
			"paymentType": paymentType,
			"paymentDescription": "",
			"paymentRemarks": remarks
		});

	let mandatoryFields = `${referenceNo}|${process.env.ICICI_SUB_MERCHANT_ID}|${amount}|${name}|${mobile}|${address}|${pan}|${email}`;

	const queryParams1 =
	{
		"merchantid": process.env.ICICI_MERCHANT_ID,
		"mandatory fields": mandatoryFields,
		"optional fields": "",
		"returnurl": `${process.env.BACKEND_BASE_URL}${process.env.ICICI_RETURN_URL}`,
		"Reference No": referenceNo,
		"submerchantid": process.env.ICICI_SUB_MERCHANT_ID,
		"transaction amount": amount,
		"paymode": process.env.ICICI_PAYMODE
	};

	const queryString1 = Object.entries(queryParams1)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");

	const paymentURL1 = `${process.env.ICICI_PAY_URL}${queryString1}`;

	console.log("plaintextURL", paymentURL1);

	const queryParams =
	{
		"merchantid": process.env.ICICI_MERCHANT_ID,
		"mandatory fields": encryptData(mandatoryFields),
		"optional fields": "",
		"returnurl": encryptData(`${process.env.BACKEND_BASE_URL}${process.env.ICICI_RETURN_URL}`),
		"Reference No": encryptData(referenceNo),
		"submerchantid": encryptData(process.env.ICICI_SUB_MERCHANT_ID),
		"transaction amount": encryptData(amount),
		"paymode": encryptData(process.env.ICICI_PAYMODE)
	};

	const queryString = Object.entries(queryParams)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");

	const paymentURL = `${process.env.ICICI_PAY_URL}${queryString}`;
	// const paymentURL = `google.com`;
	res.json(paymentURL);
});

const receiveOneTimePaymentResponse = asyncHandler(async (req, res) =>
{
	try
	{
		let receivedPaymentResponse = req.body;

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
			"E00335": "Transaction Cancelled By User",
			"E0801": "FAIL",
			"E0802": "User Dropped",
			"E0803": "Canceled by user",
			"E0804": "User Request arrived but card brand not supported",
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

		let responseCode = receivedPaymentResponse["Response Code"];
		let interchangeValue = receivedPaymentResponse["Interchange Value"];
		let tdr = receivedPaymentResponse["TDR"];
		let paymentMode = receivedPaymentResponse["Payment Mode"];
		let submerchantId = receivedPaymentResponse["SubMerchantId"];
		let ckscReferenceNo = receivedPaymentResponse["ReferenceNo"];
		let id = receivedPaymentResponse["ID"];
		let rs = receivedPaymentResponse["RS"];
		let tps = receivedPaymentResponse["TPS"];

		let transactionMessage = "Transaction Failed";
		let isPaymentSuccessful = false;
		let queryString = "";

		// FAILURE Variables
		let mandatoryFields;
		let optionalFields;
		let rsv;

		// SUCCESS Variables
		let iciciReferenceNo;
		let serviceTaxAmount;
		let processingFeeAmount;
		let totalAmount;
		let transactionAmount;
		let transactionDate;

		if (responseCode == "E000")
		{
			transactionMessage = "Transaction successful";
			isPaymentSuccessful = true;

			iciciReferenceNo = receivedPaymentResponse["Unique Ref Number"];
			serviceTaxAmount = receivedPaymentResponse["Service Tax Amount"];
			processingFeeAmount = receivedPaymentResponse["Processing Fee Amount"];
			totalAmount = receivedPaymentResponse["Total Amount"];
			transactionAmount = receivedPaymentResponse["Transaction Amount"];
			transactionDate = receivedPaymentResponse["Transaction Date"];
		}
		else
		{
			mandatoryFields = receivedPaymentResponse["mandatory fields"];
			optionalFields = receivedPaymentResponse["optional fields"];
			rsv = receivedPaymentResponse["RSV"];

			queryString = isPaymentSuccessful + "|" + responseCode + "|" + errorCodes[responseCode];
			res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
		}

		const paymentRequest = await ICICIPaymentRequest.find({ referenceNo: ckscReferenceNo });

		const paymentResponse = await ICICIPaymentResponse.create(
			{
				"ckscReferenceNo": ckscReferenceNo,
				"responseCode": responseCode,
				"iciciReferenceNo": iciciReferenceNo,
				"serviceTaxAmount": serviceTaxAmount,
				"processingFeeAmount": processingFeeAmount,
				"totalAmount": totalAmount,
				"transactionAmount": transactionAmount,
				"transactionDate": transactionDate,
				"interchangeValue": interchangeValue,
				"tdr": tdr,
				"paymentMode": paymentMode,
				"submerchantId": submerchantId,
				"tps": tps,
				"id": id,
				"rs": rs
			});

		queryString = isPaymentSuccessful + "|"
			+ paymentRequest[0].userId + "|"
			+ paymentRequest[0].icaiMembershipNo + "|"
			+ paymentRequest[0].ckscMembershipNo + "|"
			+ ckscReferenceNo + "|"
			+ iciciReferenceNo + "|"
			+ transactionDate + "|"
			+ transactionAmount + "|"
			+ paymentMode + "|"
			+ responseCode + "|"
			+ paymentRequest[0].name + "|"
			+ paymentRequest[0].email + "|"
			+ paymentRequest[0].mobile + "|"
			+ paymentResponse._id.toString() + "|"
			+ paymentRequest[0].paymentType + "|"
			+ paymentRequest[0].paymentDescription + "|"
			+ paymentRequest[0].paymentRemarks;

		res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
	}
	catch (ex)
	{
		console.log("exception is", ex);
		res.json(ex);
	}
});

const receivePaymentResponse = asyncHandler(async (req, res) =>
{
	let receivedPaymentResponse = req.body;

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
		"E00335": "Transaction Cancelled By User",
		"E0801": "FAIL",
		"E0802": "User Dropped",
		"E0803": "Canceled by user",
		"E0804": "User Request arrived but card brand not supported",
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

	// res.json(receivedPaymentResponse);

	// receivedPaymentResponse =
	// {
	// 	"ReferenceNo": "17027765402801658",
	// 	"Response Code": "E000",
	// 	"Unique Ref Number": "ICICI123456789",
	// 	"Service Tax Amount": "",
	// 	"Processing Fee Amount": "",
	// 	"Total Amount": "1000.00",
	// 	"Transaction Amount": "1000.00",
	// 	"Transaction Date": "2023-12-12",
	// 	"Interchange Value": "",
	// 	"TDR": "",
	// 	"Payment Mode": "Credit Card",
	// 	"SubMerchantId": "25",
	// 	"TPS": "",
	// 	"ID": "TXN12345",
	// 	"RS": "Successful"
	// };

	let responseCode = receivedPaymentResponse["Response Code"];
	let interchangeValue = receivedPaymentResponse["Interchange Value"];
	let tdr = receivedPaymentResponse["TDR"];
	let paymentMode = receivedPaymentResponse["Payment Mode"];
	let submerchantId = receivedPaymentResponse["SubMerchantId"];
	let ckscReferenceNo = receivedPaymentResponse["ReferenceNo"];
	let id = receivedPaymentResponse["ID"];
	let rs = receivedPaymentResponse["RS"];
	let tps = receivedPaymentResponse["TPS"];

	let transactionMessage = "Transaction Failed";
	let isPaymentSuccessful = false;
	let queryString = "";

	// FAILURE Variables
	let mandatoryFields;
	let optionalFields;
	let rsv;

	// SUCCESS Variables
	let iciciReferenceNo;
	let serviceTaxAmount;
	let processingFeeAmount;
	let totalAmount;
	let transactionAmount;
	let transactionDate;

	if (responseCode == "E000")
	{
		transactionMessage = "Transaction successful";
		isPaymentSuccessful = true;

		iciciReferenceNo = receivedPaymentResponse["Unique Ref Number"];
		serviceTaxAmount = receivedPaymentResponse["Service Tax Amount"];
		processingFeeAmount = receivedPaymentResponse["Processing Fee Amount"];
		totalAmount = receivedPaymentResponse["Total Amount"];
		transactionAmount = receivedPaymentResponse["Transaction Amount"];
		transactionDate = receivedPaymentResponse["Transaction Date"];
	}
	else
	{
		mandatoryFields = receivedPaymentResponse["mandatory fields"];
		optionalFields = receivedPaymentResponse["optional fields"];
		rsv = receivedPaymentResponse["RSV"];

		queryString = isPaymentSuccessful + "|" + responseCode + "|" + errorCodes[responseCode];
		res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
	}

	const paymentRequest = await ICICIPaymentRequest.find({ referenceNo: ckscReferenceNo });
	await reduceThePendingAmount(totalAmount, paymentRequest[0].userId);

	const paymentResponse = await ICICIPaymentResponse.create(
		{
			"ckscReferenceNo": ckscReferenceNo,
			"responseCode": responseCode,
			"iciciReferenceNo": iciciReferenceNo,
			"serviceTaxAmount": serviceTaxAmount,
			"processingFeeAmount": processingFeeAmount,
			"totalAmount": totalAmount,
			"transactionAmount": transactionAmount,
			"transactionDate": transactionDate,
			"interchangeValue": interchangeValue,
			"tdr": tdr,
			"paymentMode": paymentMode,
			"submerchantId": submerchantId,
			"tps": tps,
			"id": id,
			"rs": rs
		});

	const userPaymentResponse = await UserPayment.create(
		{
			"userId": paymentRequest[0].userId,
			"paymentRequestId": paymentRequest[0]._id,
			"paymentResponseId": paymentResponse._id,
			"paymentStatus": "Init -> " + transactionMessage
		});

	queryString = isPaymentSuccessful + "|"
		+ paymentRequest[0].userId + "|"
		+ paymentRequest[0].icaiMembershipNo + "|"
		+ paymentRequest[0].ckscMembershipNo + "|"
		+ ckscReferenceNo + "|"
		+ iciciReferenceNo + "|"
		+ transactionDate + "|"
		+ transactionAmount + "|"
		+ paymentMode + "|"
		+ responseCode + "|"
		+ paymentRequest[0].name + "|"
		+ paymentRequest[0].email + "|"
		+ paymentRequest[0].mobile + "|"
		+ userPaymentResponse._id.toString()
		+ paymentRequest[0].paymentType + "|"
		+ paymentRequest[0].paymentDescription + "|"
		+ paymentRequest[0].paymentRemarks;

	res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
});

const reduceThePendingAmount = async (amountToReduce, userId) =>
{
	const user = await User.findById(userId);

	if (!user)
	{
		throw new Error("User Not found");
	}

	user.pendingAmount -= amountToReduce;

	await user.save();
};

const verifyTransaction = asyncHandler(async (req, ckscResponse) =>
{
	// Merchant ID, Reference Number needed
});

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
	fetchOneTimePaymentRequestURL, fetchPaymentRequestURL, receiveOneTimePaymentResponse, receivePaymentResponse, verifyTransaction
};
