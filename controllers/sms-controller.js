const asyncHandler = require("express-async-handler");
const axios = require("axios");

const sendSMS = asyncHandler(async (req, res) =>
{
	let mobileNumber = req.body.mobileNumber;
	mobileNumber = "8100318714";

	let memberName = req.body.memberName;
	let paidAmount = req.body.paidAmount;

	let message = `Dear ${memberName} you have been registered for CKCA MEGA Conference at LALIT on 03.09.2022. Your Regn. sl no. is ${paidAmount}. Regn. starts at 9:15am`;

	let param1 = `workingkey=${process.env.SMS_KEY}`;
	let param2 = `sender=${process.env.SMS_SENDER}`;
	let param3 = `to=${mobileNumber}`;
	let param4 = `message=${message}`;

	let urlEnd = param1 + "&" + param2 + "&" + param3 + "&" + param4;

	await axios.get(`${process.env.SMS_BASE_URL}?${urlEnd}`);

	res.status(200);
});

module.exports =
{
	sendSMS
};
