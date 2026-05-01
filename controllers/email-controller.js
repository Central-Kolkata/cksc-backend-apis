const axios = require("axios");
const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");
const { Resend } = require("resend");
const EmailLog = require("../models/email-log-model");

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
	return { success: true, service: 'brevo', data: response.data };
};

const sendCKCAEmailViaResend = async (emailObject) =>
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
	return { success: true, service: 'resend', data };
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
		await sendCKCAEmailViaResend(emailObject);
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

// Handler for sending Welcome email
const sendWelcomeEmail = asyncHandler(async (req, res) =>
{
	const { member } = req.body;

	const emailObject = {
		email: member.email,
		subject: `Welcome to Central Kolkata Chartered Accountants Association! 🤝`,
		body: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #2c3e50 0%, #000000 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Welcome to the Association</h1>
                    <p style="font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">Central Kolkata Chartered Accountants Association</p>
                </div>
                <div style="padding: 40px 30px; background-color: #ffffff;">
                    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear <b>${member.name}</b>,</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        It is our great pleasure to welcome you as a member of the <b>Central Kolkata Chartered Accountants Association</b>. 
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        We are thrilled to have you join our community of professionals. As a member, you will have access to our upcoming events, professional networking opportunities, and regular updates from the association.
                    </p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                        <p style="margin: 0; font-weight: bold; color: #2c3e50;">Your Membership Details:</p>
                        <p style="margin: 10px 0 0 0; color: #555;"><b>Name:</b> ${member.name}</p>
                        <p style="margin: 5px 0 0 0; color: #555;"><b>Membership No:</b> ${member.ckscMembershipNo || member.icaiMembershipNo || 'Pending'}</p>
                    </div>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        We look forward to your active participation in our future activities. Should you have any questions or require assistance, please feel free to reach out to us.
                    </p>
                    <div style="margin: 30px 0; height: 1px; background-color: #eee;"></div>
                    <p style="font-size: 14px; color: #888;">Warmest Regards,</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold; margin-top: 5px;">Managing Committee</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold;">Central Kolkata Chartered Accountants Association</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} Central Kolkata Chartered Accountants Association<br/>
                    This is an automated welcome message.
                </div>
            </div>
        `
	};

	try
	{
		let result = await sendCKCAEmailViaResend(emailObject).catch(async (err) => {
            console.log('Resend failed for Welcome email, falling back to Brevo...');
            return await deliverEmailViaBrevo(emailObject);
        });

        await EmailLog.create({
            recipientEmail: member.email,
            recipientName: member.name,
            subject: emailObject.subject,
            emailType: 'welcome',
            serviceUsed: result.service,
            status: 'sent'
        });
		return res.send("Success");
	}
	catch (error)
	{
		console.error('Welcome email failed:', error.message);
        await EmailLog.create({
            recipientEmail: member.email,
            recipientName: member.name,
            subject: emailObject.subject,
            emailType: 'welcome',
            serviceUsed: 'none',
            status: 'failed',
            error: error.message
        });
		return res.status(500).json({ error: error.message });
	}
});

module.exports =
{
	sendCKCAEmail,
	sendEmailForAKP,
	sendCKCAEmailResend,
	sendWelcomeEmail,
    deliverEmailViaBrevo,
    sendCKCAEmailViaResend
};
