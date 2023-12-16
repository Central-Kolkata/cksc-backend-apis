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
	res.json(paymentURL);
});

const receivePaymentResponse = asyncHandler(async (req, res) =>
{
	let receivedPaymentResponse = req.body;

	receivePaymentResponse =
	{
		"ReferenceNo": "17027584651518916",
		"Response Code": "E000",
		"Unique Ref Number": "ICICI123456789",
		"Service Tax Amount": "",
		"Processing Fee Amount": "",
		"Total Amount": "1000.00",
		"Transaction Amount": "1000.00",
		"Transaction Date": "2023-12-12",
		"Interchange Value": "",
		"TDR": "",
		"Payment Mode": "Credit Card",
		"SubMerchantId": "25",
		"TPS": "",
		"ID": "TXN12345",
		"RS": "Successful"
	};

	let ckscReferenceNo = receivePaymentResponse["ReferenceNo"];
	let responseCode = receivePaymentResponse["Response Code"];
	let iciciReferenceNo = receivePaymentResponse["Unique Ref Number"];
	let serviceTaxAmount = receivePaymentResponse["Service Tax Amount"];
	let processingFeeAmount = receivePaymentResponse["Processing Fee Amount"];
	let totalAmount = receivePaymentResponse["Total Amount"];
	let transactionAmount = receivePaymentResponse["Transaction Amount"];
	let transactionDate = receivePaymentResponse["Transaction Date"];
	let interchangeValue = receivePaymentResponse["Interchange Value"];
	let tdr = receivePaymentResponse["TDR"];
	let paymentMode = receivePaymentResponse["Payment Mode"];
	let submerchantId = receivePaymentResponse["SubMerchantId"];
	let tps = receivePaymentResponse["TPS"];
	let id = receivePaymentResponse["ID"];
	let rs = receivePaymentResponse["RS"];

	let transactionMessage = "Transaction Failed";

	if (responseCode == "E000")
	{
		transactionMessage = "Transaction successful";
	}

	const paymentRequest = await ICICIPaymentRequest.find({ referenceNo: ckscReferenceNo });

	console.log("paymentRequest", paymentRequest);

	// const paymentResponse = await PaymentResponse.create(
	// 	{
	// 		"transactionId": response.mer_txn,
	// 		"transactionTimestamp": response.date,
	// 		"cardNumber": response.CardNumber,
	// 		"surcharge": response.surcharge,
	// 		"scheme": response.scheme,
	// 		"signature": response.signature,
	// 		"amount": response.amt,
	// 		"fCode": response.f_code,
	// 		"bankTransactionReference": response.bank_txn,
	// 		"ipgTransactionId": response.ipg_txn_id,
	// 		"bankName": response.bank_name,
	// 		"mmpTransaction": response.mmp_txn,
	// 		"discriminator": response.discriminator,
	// 		"authCode": response.auth_code,
	// 		"description": response.desc,
	// 		"transactionMessage": transactionMessage,
	// 		"udf1": response.udf1,
	// 		"udf2": response.udf2,
	// 		"udf3": response.udf3,
	// 		"udf4": response.udf4
	// 	});

	// const userPaymentResponse = await UserPayment.create(
	// 	{
	// 		"userId": paymentRequest[0].userId,
	// 		"paymentRequestId": paymentRequest[0]._id,
	// 		"paymentResponseId": paymentResponse._id,
	// 		"paymentStatus": "Init -> " + transactionMessage
	// 	});

	// const success = transactionMessage === "Transaction successful";

	// let queryString = success + "|" + paymentRequest[0].userId + "|" + paymentRequest[0].icaiMembershipNo + "|" + paymentRequest[0].ckscMembershipNo + "|" + response.mer_txn + "|" + response.date + "|" + response.CardNumber + "|"
	// 	+ response.amt + "|" + response.surcharge + "|" + response.bank_txn + "|"
	// 	+ response.ipg_txn_id + "|" + response.bank_name + "|" + response.desc + "|"
	// 	+ response.udf1 + "|" + response.udf2 + "|" + response.udf3 + "|" + response.udf4 + "|" + userPaymentResponse._id.toString();

	// res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
	res.json(req.body);
});

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
