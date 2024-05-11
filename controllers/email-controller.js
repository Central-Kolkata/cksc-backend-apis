const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");
const axios = require("axios");

const transporter = nodemailer.createTransport(
	{
		host: "smtp.gmail.com",
		port: 587,
		secure: false, // Use `true` for port 465, `false` for all other ports
		auth:
		{
			user: `${process.env.GOOGLE_EMAIL}`,
			pass: `${process.env.GOOGLE_EMAIL_APP_PASSWORD}`,
		},
	});

const sendEmail = asyncHandler(async (req, res) =>
{
	try
	{
		const emailObject = req.body["emailObject"];

		const emailOptions =
		{
			from:
			{
				name: "Central Kolkata Chartered Accountants",
				address: process.env.GOOGLE_EMAIL
			},
			to: [emailObject.email],
			bcc: "cksc.suvishakha@gmail.com",
			subject: emailObject.subject,
			text: emailObject.body,
			html: emailObject.body
		};

		const output = await transporter.sendMail(emailOptions);
		res.send(output);
	}
	catch (error)
	{
		res.error(500).json({ error });
	}
});

module.exports =
{
	sendEmail
};
