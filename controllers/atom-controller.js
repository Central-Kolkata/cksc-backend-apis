const asyncHandler = require("express-async-handler");
const ndps = require('ndps-nodejs');
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const PaymentRequest = require("../models/payment-request");
const PaymentResponse = require("../models/payment-response");

const createPaymentRequest = asyncHandler(async (req, res) =>
{
	var request = req.body;

	let userId = request.userId;

	let loginId = process.env.LOGIN_ID;
	let password = process.env.PASSWORD;
	let txnType = process.env.TXN_TYPE;
	let productId = process.env.PRODUCT_ID;
	let clientCode = process.env.CLIENT_CODE;
	let custAcc = process.env.CUST_ACC;
	let ru = process.env.RU;
	let payURL = process.env.PAY_URL;
	let hashEncryptionKey = process.env.HASH_REQUEST_ENCRYPTION_KEY;
	let requestEncryptionKey = process.env.REQUEST_ENCRYPTION_KEY;

	let udf1 = request.udf1 || "udf-11"; // Name
	let udf2 = request.udf2 || "udf-22"; // Email
	let udf3 = request.udf3 || "udf-33"; // Mobile
	let udf11 = request.udf11 || "udf-11"; // CKSC Registration Number

	let amount = request.amount;
	let transactionId = uuidv4();

	await PaymentRequest.create(
		{
			"userId": userId,
			"productId": productId,
			"transactionId": transactionId,
			"amount": amount,
			"udf1": udf1,
			"udf2": udf2,
			"udf3": udf3,
			"udf11": udf11,
			"udf12": transactionId
		});

	var requestNdpsPayment =
	{
		loginid: loginId,
		password: password,
		ttype: txnType,
		productid: productId,
		txnId: transactionId, // CKSC unique order id - for each txn
		amount: amount,
		txncurrency: "INR",
		clientcode: clientCode, // base64(CKSC)
		date: moment().format("DD/MM/yyyy HH:m:ss"),
		custacc: custAcc,
		udf1: udf1, // Name
		udf2: udf2, // Email
		udf3: udf3, // Mobile
		udf11: userId, // userId
		udf12: transactionId, // transactionId
		ru: ru,
		payUrl: payURL,
		encHashKey: hashEncryptionKey,
		encRequestKey: requestEncryptionKey
	};

	res.redirect(ndps.ndpsencrypt(requestNdpsPayment));
});

const receivePaymentResponse = asyncHandler(async (req, res) =>
{
	var responseNdpsPayment =
	{
		response: req.body.encdata,
		decResponseKey: process.env.RESPONSE_ENCRYPTION_KEY
	};

	var response = ndps.ndpsresponse(responseNdpsPayment);
	var signature = ndps.verifysignature(response, process.env.HASH_RESPONSE_ENCRYPTION_KEY);

	console.log("Final response", response);

	var transactionMessage = "Transaction Failed due to signature mismatch";

	if (signature === response["signature"])
	{
		if (response["f_code"] == "Ok")
		{
			transactionMessage = "Transaction successful";
		}
		else if (response["f_code"] == "C")
		{
			transactionMessage = "Transaction Cancelled";
		}
		else
		{
			transactionMessage = "Transaction Failed";
		}
	}

	await PaymentResponse.create(
		{
			"userId": response.udf11,
			"transactionId": response.udf12,
			"transactionTimestamp": response.date,
			"cardNumber": response.CardNumber,
			"surcharge": response.surcharge,
			"scheme": response.scheme,
			"signature": response.signature,
			"amount": response.amt,
			"merchantTransaction": response.mer_txn,
			"fCode": response.f_code,
			"bankTransactionReference": response.bank_txn,
			"ipgTransactionId": response.ipg_txn_id,
			"bankName": response.bank_name,
			"mmpTransaction": response.mmp_txn,
			"discriminator": response.discriminator,
			"authCode": response.auth_code,
			"description": response.desc,
			"transactionMessage": transactionMessage,
			"udf1": response.udf1,
			"udf2": response.udf2,
			"udf3": response.udf3,
			"udf11": response.udf11,
			"udf12": response.udf12
		});

	res.json(transactionMessage);
});

module.exports =
{
	createPaymentRequest, receivePaymentResponse
};
