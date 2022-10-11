const asyncHandler = require("express-async-handler");
const axios = require("axios");
const ndps = require('ndps-nodejs');
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const PaymentRequest = require("../models/payment-request");
const PaymentResponse = require("../models/payment-response");
const PaymentRequery = require("../models/payment-requery");

const fetchPaymentRequestURL = asyncHandler(async (req, res) =>
{
	var request = req.body;

	let userId = request.userId;
	let icaiMembershipNo = request.icaiMembershipNo;
	let ckscMembershipNo = request.ckscMembershipNo;

	let loginId = process.env.LOGIN_ID;
	let password = process.env.PASSWORD;
	let txnType = process.env.TXN_TYPE;
	let productId = process.env.PRODUCT_ID;
	let clientCode = process.env.CLIENT_CODE;
	let custAcc = process.env.CUST_ACC;
	let ru = process.env.BACKEND_BASE_URL + process.env.RU;
	let payURL = process.env.PAY_URL;
	let hashEncryptionKey = process.env.HASH_REQUEST_ENCRYPTION_KEY;
	let requestEncryptionKey = process.env.REQUEST_ENCRYPTION_KEY;

	let udf1 = request.udf1 || "udf-11"; // Name
	let udf2 = request.udf2 || "udf-22"; // Email
	let udf3 = request.udf3 || "udf-33"; // Mobile

	let amount = request.amount;
	let transactionId = uuidv4();

	await PaymentRequest.create(
		{
			"userId": userId,
			"icaiMembershipNo": icaiMembershipNo,
			"ckscMembershipNo": ckscMembershipNo,
			"productId": productId,
			"transactionId": transactionId,
			"amount": amount,
			"udf1": udf1,
			"udf2": udf2,
			"udf3": udf3
		});

	var requestNdpsPayment =
	{
		loginid: loginId,
		password: password,
		ttype: txnType,
		productid: productId,
		transactionsid: transactionId, // CKSC unique order id - for each txn
		amount: amount,
		txncurrency: "INR",
		clientcode: clientCode, // base64(CKSC)
		date: moment().format("DD/MM/yyyy HH:m:ss"),
		custacc: custAcc,
		udf1: udf1, // Name
		udf2: udf2, // Email
		udf3: udf3, // Mobile
		ru: ru,
		payUrl: payURL,
		encHashKey: hashEncryptionKey,
		encRequestKey: requestEncryptionKey
	};

	console.log("requestNdpsPayment is: ", requestNdpsPayment);

	res.json(ndps.ndpsencrypt(requestNdpsPayment));
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

	const paymentRequest = await PaymentRequest.find({ transactionId: response.mer_txn });

	console.log("paymentRequest", paymentRequest);

	await PaymentResponse.create(
		{
			"transactionId": response.mer_txn,
			"transactionTimestamp": response.date,
			"cardNumber": response.CardNumber,
			"surcharge": response.surcharge,
			"scheme": response.scheme,
			"signature": response.signature,
			"amount": response.amt,
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
			"udf3": response.udf3
		});

	console.log("transactionMessage", transactionMessage);

	const success = transactionMessage === "Transaction successful";

	let queryString = success + "|" + paymentRequest[0].userId + "|" + paymentRequest[0].icaiMembershipNo + "|" + paymentRequest[0].ckscMembershipNo + "|" + response.mer_txn + "|" + response.date + "|" + response.CardNumber + "|"
		+ response.amt + "|" + response.surcharge + "|" + response.bank_txn + "|"
		+ response.ipg_txn_id + "|" + response.bank_name + "|" + response.desc + "|"
		+ response.udf1 + "|" + response.udf2 + "|" + response.udf3;

	res.redirect(`${process.env.CKSC_BASE_URL}/payment-response.html?${queryString}`);
});

const fetchRequeryURL = asyncHandler(async (req, res) =>
{
	var request = req.body;

	let loginId = process.env.LOGIN_ID;
	let merchantId = process.env.LOGIN_ID;

	let merchantTransactionId = request.merchantTransactionId;
	let amount = request.amount;
	let transactionDate = request.transactionDate;

	let requeryURL = process.env.REQUERY_URL;
	let requeryRU = process.env.requeryRU;
	let clientCode = process.env.CLIENT_CODE;
	let hashEncryptionKey = process.env.HASH_REQUEST_ENCRYPTION_KEY;
	let requestEncryptionKey = process.env.REQUEST_ENCRYPTION_KEY;

	await PaymentRequery.create(
		{
			"loginId": loginId,
			"merchantId": merchantId,
			"merchantTransactionId": merchantTransactionId,
			"amount": amount,
			"transactionDate": transactionDate
		});

	var requestNdpsVerification =
	{
		clientcode: clientCode, // base64(CKSC)
		loginid: loginId,
		merchantid: merchantId,
		merchanttxnid: merchantTransactionId,
		amt: amount,
		tdate: transactionDate,
		ru: requeryRU,
		payUrl: requeryURL,
		encHashKey: hashEncryptionKey,
		encRequestKey: requestEncryptionKey
	};

	console.log("requestNdpsVerification is: ", requestNdpsVerification);

	res.json(ndps.ndpsencrypt(requestNdpsVerification));
});

const createRequeryRequest = asyncHandler(async (req, res) =>
{
	console.log("request", req.body.url);
	const response = await axios.get(req.body.url);

	var responseNdpsPayment =
	{
		response: response.data,
		decResponseKey: process.env.RESPONSE_ENCRYPTION_KEY
	};

	const finalResponse = ndps.ndpsresponse(responseNdpsPayment);

	console.log(finalResponse);

	res.json(finalResponse);
});

const decodeResponse = (responseData) =>
{
	var responseNdpsPayment =
	{
		response: responseData,
		decResponseKey: process.env.RESPONSE_ENCRYPTION_KEY
	};

	var response = ndps.ndpsresponse(responseNdpsPayment);
	var signature = ndps.verifysignature(response, process.env.HASH_RESPONSE_ENCRYPTION_KEY);

	console.log("Requery response", response);
};

const receiveRequeryResponse = asyncHandler(async (req, res) =>
{
	var responseNdpsPayment =
	{
		response: req.body.encdata,
		decResponseKey: process.env.RESPONSE_ENCRYPTION_KEY
	};

	var response = ndps.ndpsresponse(responseNdpsPayment);
	var signature = ndps.verifysignature(response, process.env.HASH_RESPONSE_ENCRYPTION_KEY);

	console.log("Requery response", response);

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

	res.json(transactionMessage);
});

module.exports =
{
	fetchPaymentRequestURL, receivePaymentResponse, fetchRequeryURL, createRequeryRequest, receiveRequeryResponse
};
