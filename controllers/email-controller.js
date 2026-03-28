const axios = require("axios");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");
const { Resend } = require("resend");

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const brevoApiUrl = "https://api.brevo.com/v3/smtp/email";

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

const transporterAKP = createTransporter(process.env.GOOGLE_EMAIL_AKP, process.env.GOOGLE_EMAIL_AKP_APP_PASSWORD);

const toPlainText = (body = "") => body.replace(/<[^>]*>/g, '');

const deliverEmailViaBrevo = async (emailObject) =>
{
	if (!process.env.BREVO_API_KEY)
	{
		throw new Error("BREVO_API_KEY is not configured.");
	}

	const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@centralkolkata.org";
	const senderName = process.env.BREVO_SENDER_NAME || "Central Kolkata Chartered Accountants";

	const payload = {
		sender: {
			name: senderName,
			email: senderEmail,
		},
		to: [
			{
				email: emailObject.email,
			},
		],
		subject: emailObject.subject,
		htmlContent: emailObject.body,
		textContent: toPlainText(emailObject.body),
	};

	console.log('Sending email via Brevo:', {
		to: emailObject.email,
		subject: emailObject.subject
	});

	const response = await axios.post(brevoApiUrl, payload, {
		headers: {
			'accept': 'application/json',
			'api-key': process.env.BREVO_API_KEY,
			'content-type': 'application/json',
		},
		timeout: 15000,
	});

	console.log('Brevo email sent successfully:', response.data);
	return response.data;
};

const sendCKCAEmailWithFallback = async (emailObject) =>
{
	console.log('Preparing to send CKCA email via Resend:', {
		to: emailObject.email,
		subject: emailObject.subject
	});

	const resendPayload = {
		from: 'Central Kolkata Chartered Accountants <noreply@centralkolkata.org>',
		to: [emailObject.email],
		subject: emailObject.subject,
		html: emailObject.body,
		text: toPlainText(emailObject.body),
	};

	const { data, error } = await resend.emails.send(resendPayload);

	if (error)
	{
		throw new Error(error.message || 'Resend send failed');
	}

	console.log('Resend email sent successfully:', data);
	return data;
};

// Function to send email
const sendEmail = async (transporter, fromName, fromAddress, emailObject, res) =>
{
	try
	{
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
			subject: emailObject.subject,
			text: toPlainText(emailObject.body),
			html: emailObject.body,
		};
		console.log('Email options ready, sending...');
		const output = await transporter.sendMail(emailOptions);
		console.log('Email sendMail output:', output);
		if (output.accepted.length > 0)
		{
			res.send("Success");
		} else
		{
			res.send(output);
		}
	} catch (error)
	{
		console.error('Error sending email:', error);
		res.status(500).json({ error });
	}
};

const handleCKCAEmailRequest = async (req, res) =>
{
	const emailObject = req.body.emailObject;

	try
	{
		await sendCKCAEmailWithFallback(emailObject);
		return res.send("Success");
	}
	catch (resendError)
	{
		console.error('Resend failed for CKCA email:', resendError.message);
		console.log('Falling back to Brevo for CKCA email delivery...');

		try
		{
			await deliverEmailViaBrevo(emailObject);
			return res.send("Success");
		}
		catch (brevoError)
		{
			console.error('Brevo fallback failed:', brevoError.response?.data || brevoError.message);
			return res.status(500).json({
				error: brevoError.response?.data || brevoError.message
			});
		}
	}
};

// Handler for sending CKCA email
const sendCKCAEmail = asyncHandler(handleCKCAEmailRequest);

// Handler for sending AKP email
const sendEmailForAKP = asyncHandler(async (req, res) =>
{
	const emailObject = req.body.emailObject;
	await sendEmail(transporterAKP, "भारत का Phone", process.env.GOOGLE_EMAIL_AKP, emailObject, res);
});

// Handler for sending CKCA email via Resend
const sendCKCAEmailResend = asyncHandler(async (req, res) =>
{
	await handleCKCAEmailRequest(req, res);
});

module.exports =
{
	sendCKCAEmail,
	sendEmailForAKP,
	sendCKCAEmailResend,
};
