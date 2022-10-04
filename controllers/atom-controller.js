const asyncHandler = require("express-async-handler");
const ndps = require('ndps-nodejs');
const moment = require("moment");

const createPaymentRequest = asyncHandler(async (req, res) =>
{
	var request = req.body;

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

	let udf1 = request.udf1 || "udf-11";
	let udf2 = request.udf2 || "udf-22";
	let udf3 = request.udf3 || "udf-33";
	let udf4 = request.udf4 || "udf-44";

	let transactionId = request.transactionId || "txn-1001";
	let amount = request.amount || "181.00";

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
		udf1: udf1,
		udf2: udf2,
		udf3: udf3,
		udf4: udf4,
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

	console.log("responseNdpsPayment", responseNdpsPayment);

	var response = ndps.ndpsresponse(responseNdpsPayment);
	var signature = ndps.verifysignature(response, process.env.HASH_RESPONSE_ENCRYPTION_KEY);

	console.log("Final response", response);

	if (signature === response["signature"])
	{
		if (response["f_code"] == "Ok")
		{
			console.log("Transaction successful");
			res.json("Transaction successful");
		}
		else if (response["f_code"] == "C")
		{
			res.json("Transaction Cancelled");
		}
		else
		{
			res.json("Transaction Failed");
		}
	}
	else
	{
		res.json("Transaction Failed");
	}
});

module.exports =
{
	createPaymentRequest, receivePaymentResponse
};
