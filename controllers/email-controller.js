const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

// Function to create a transporter
const createTransporter = (user, pass) =>
{
	return nodemailer.createTransport(
		{
			host: "smtp.gmail.com",
			port: 587,
			secure: false,
			auth:
			{
				user,
				pass,
			},
		});
};

const transporterCKCA = createTransporter(process.env.GOOGLE_EMAIL, process.env.GOOGLE_EMAIL_APP_PASSWORD);
const transporterAKP = createTransporter(process.env.GOOGLE_EMAIL_AKP, process.env.GOOGLE_EMAIL_AKP_APP_PASSWORD);

// Function to send email
const sendEmail = async (transporter, fromName, fromAddress, emailObject, res) => {
	try {
		console.log('Preparing to send email:', {
			fromName,
			fromAddress,
			to: emailObject.email,
			subject: emailObject.subject
		});
		const emailOptions = {
			from: {
				name: fromName,
				address: fromAddress,
			},
			to: [emailObject.email],
			bcc: "cksc.suvishakha@gmail.com",
			subject: emailObject.subject,
			text: emailObject.body,
			html: emailObject.body,
		};
		console.log('Email options ready, sending...');
		const output = await transporter.sendMail(emailOptions);
		console.log('Email sendMail output:', output);
		if (output.accepted.length > 0) {
			res.send("Success");
		} else {
			res.send(output);
		}
	} catch (error) {
		console.error('Error sending email:', error);
		res.status(500).json({ error });
	}
};

// Handler for sending CKCA email
const sendCKCAEmail = asyncHandler(async (req, res) =>
{
	const emailObject = req.body.emailObject;
	await sendEmail(transporterCKCA, "Central Kolkata Chartered Accountants", process.env.GOOGLE_EMAIL, emailObject, res);
});

// Handler for sending AKP email
const sendEmailForAKP = asyncHandler(async (req, res) =>
{
	const emailObject = req.body.emailObject;
	await sendEmail(transporterAKP, "भारत का Phone", process.env.GOOGLE_EMAIL_AKP, emailObject, res);
});

module.exports =
{
	sendCKCAEmail,
	sendEmailForAKP,
};
