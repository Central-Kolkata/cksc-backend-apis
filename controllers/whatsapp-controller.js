const asyncHandler = require("express-async-handler");
const axios = require("axios");

const sendWhatsAppMessage = asyncHandler(async (req, res) =>
{
	const accountSid = process.env.TWILIO_SID;
	const authToken = process.env.TWILIO_SECRET;
	const client = require("twilio")(accountSid, authToken);

	client.messages
		.create(
			{
				from: "whatsapp:+16692807882",
				body: "Your asdf code is 1234",
				to: "whatsapp:+917980911425"
			})
		.then(message => console.log(message.sid))
		.catch(err => console.log(err));
});

module.exports =
{
	sendWhatsAppMessage
};
