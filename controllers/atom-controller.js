const asyncHandler = require("express-async-handler");
const axios = require("axios");
const ndps = require('ndps-nodejs');
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const PaymentRequest = require("../models/payment-request");
const PaymentResponse = require("../models/payment-response");
const PaymentRequery = require("../models/payment-requery");
const crypto = require('crypto');
var unirest = require("unirest");

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
		merchantid: merchantId,
		merchanttxnid: merchantTransactionId,
		amt: amount,
		tdate: transactionDate,
		clientcode: clientCode, // base64(CKSC)
		loginid: loginId,
		payUrl: requeryURL,
		encHashKey: hashEncryptionKey,
		encRequestKey: requestEncryptionKey
	};

	console.log("requestNdpsVerification is: ", requestNdpsVerification);

	res.json(ndps.ndpsencrypt(requestNdpsVerification));
});

const createRequeryRequest = asyncHandler(async (req, res) =>
{
	console.log("Requery Request URL:\n", req.body.url);
	const response = await axios.get(req.body.url);

	console.log("============================");
	console.log("first", response.data);
	console.log("============================");
	console.log("second", process.env.RESPONSE_ENCRYPTION_KEY);

	var responseNdpsPayment =
	{
		response: response.data,
		decResponseKey: process.env.RESPONSE_ENCRYPTION_KEY
	};

	console.log("============================");
	console.log("third", responseNdpsPayment);

	const finalResponse = ndps.ndpsresponse(responseNdpsPayment);

	console.log("Requery Response Data\n", finalResponse);

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

const requeryTransaction = asyncHandler(async (req, res) =>
{
	var request = req.body;

	console.log("request", request);

	let merchTxnId = request.merchantTransactionId;
	let amount = request.amount;
	let date = request.transactionDate;
	let merchId = process.env.LOGIN_ID;

	let req_enc_key = process.env.REQUEST_ENCRYPTION_KEY;
	let req_salt = process.env.REQUEST_ENCRYPTION_KEY;

	let res_dec_key = process.env.RESPONSE_ENCRYPTION_KEY;
	let res_dec_salt = process.env.RESPONSE_ENCRYPTION_KEY;

	var strToEnc = "merchantid=" + merchId + "&merchanttxnid=" + merchTxnId + "&amt=" + amount + "&tdate=" + date;

	const algorithm = 'aes-256-cbc';
	const password = Buffer.from(req_enc_key, 'utf8');
	const salt = Buffer.from(req_salt, 'utf8');
	const iv = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 'utf8');

	const encrypt = (text) =>
	{
		var derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha1');
		const cipher = crypto.createCipheriv(algorithm, derivedKey, iv);
		let encrypted = cipher.update(text);
		encrypted = Buffer.concat([encrypted, cipher.final()]);
		return `${encrypted.toString('hex')}`;
	};

	var encdata = encrypt(strToEnc);
	var req = unirest("POST", "https://paynetzuat.atomtech.in/paynetz/vftsv2"); // change url in case of production

	req.headers(
		{
			"cache-control": "no-cache",
			"content-type": "application/x-www-form-urlencoded"
		});

	req.form(
		{
			"login": merchId,
			"encdata": encdata
		});

	req.end(function (res)
	{
		if (res.error) throw new Error(res.error);

		let datas = res.body;

		const password = Buffer.from(res_dec_key, 'utf8');
		const salt = Buffer.from(res_dec_salt, 'utf8');

		const decrypt = (text) =>
		{
			const encryptedText = Buffer.from(text, 'hex');
			var derivedKey = crypto.pbkdf2Sync(password, salt, 65536, 32, 'sha1');
			const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv);
			let decrypted = decipher.update(encryptedText);
			decrypted = Buffer.concat([decrypted, decipher.final()]);
			return decrypted.toString();
		};

		var decrypted_data = decrypt(datas);
		let jsonData = JSON.parse(decrypted_data);
		let respArray = Object.keys(jsonData).map(key => jsonData[key]);

		if (respArray[0]['verified'] === 'SUCCESS')
		{
			console.log("To see full array result");
			console.log(respArray[0]);
			console.log("Query Status = " + respArray[0]['verified']);
		}
		else
		{
			console.log("Failed");
		}
	});
});

module.exports =
{
	fetchPaymentRequestURL, receivePaymentResponse, fetchRequeryURL, createRequeryRequest, receiveRequeryResponse, requeryTransaction
};
