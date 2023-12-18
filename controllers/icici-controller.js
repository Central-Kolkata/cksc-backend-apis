const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const ICICIPaymentRequest = require("../models/icici-payment-request");
const ICICIPaymentResponse = require("../models/icici-payment-response");
const User = require("../models/user-model");
const UserPayment = require("../models/user-payment");

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

	let amount = request.amount;
	let referenceNo = generateEnhancedTimestampId(); // Will be used for reverifying a transaction

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
			"referenceNo": referenceNo
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

const receivePaymentResponse = asyncHandler(async (req, res) =>
{
	let receivedPaymentResponse = req.body;

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

	let ckscReferenceNo = receivedPaymentResponse["ReferenceNo"];
	let responseCode = receivedPaymentResponse["Response Code"];
	let iciciReferenceNo = receivedPaymentResponse["Unique Ref Number"];
	let serviceTaxAmount = receivedPaymentResponse["Service Tax Amount"];
	let processingFeeAmount = receivedPaymentResponse["Processing Fee Amount"];
	let totalAmount = receivedPaymentResponse["Total Amount"];
	let transactionAmount = receivedPaymentResponse["Transaction Amount"];
	let transactionDate = receivedPaymentResponse["Transaction Date"];
	let interchangeValue = receivedPaymentResponse["Interchange Value"];
	let tdr = receivedPaymentResponse["TDR"];
	let paymentMode = receivedPaymentResponse["Payment Mode"];
	let submerchantId = receivedPaymentResponse["SubMerchantId"];
	let tps = receivedPaymentResponse["TPS"];
	let id = receivedPaymentResponse["ID"];
	let rs = receivedPaymentResponse["RS"];

	let transactionMessage = "Transaction Failed";
	let isPaymentSuccessful = false;

	if (responseCode == "E000")
	{
		transactionMessage = "Transaction successful";
		isPaymentSuccessful = true;
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

	let queryString = isPaymentSuccessful + "|"
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
		+ userPaymentResponse._id.toString();

	res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
});

const reduceThePendingAmount = async (totalAmount, userId) =>
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
	fetchPaymentRequestURL, receivePaymentResponse, verifyTransaction
};
