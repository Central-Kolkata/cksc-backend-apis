const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const ICICIPaymentRequest = require("../models/icici-payment-request");

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

	const queryParams =
	{
		merchantid: process.env.ICICI_MERCHANT_ID,
		mandatoryfields: encryptData(mandatoryFields),
		returnurl: encryptData(process.env.BACKEND_BASE_URL + process.env.ICICI_RETURN_URL),
		ReferenceNo: encryptData(referenceNo),
		submerchantid: encryptData(process.env.ICICI_SUB_MERCHANT_ID),
		"transaction amount": encryptData(amount),
		paymode: encryptData(process.env.ICICI_PAYMODE)
	};

	const queryString = Object.entries(queryParams)
		.map(([key, value]) => `${key}=${value}`)
		.join("&");

	const paymentURL = `${process.env.ICICI_PAY_URL}${queryString}`;

	res.json(paymentURL);
});

const receivePaymentResponse = asyncHandler(async (req, res) =>
{
	console.log(req.body);
});

const requeryTransaction = asyncHandler(async (req, ckscResponse) =>
{
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
	fetchPaymentRequestURL, receivePaymentResponse, requeryTransaction
};
