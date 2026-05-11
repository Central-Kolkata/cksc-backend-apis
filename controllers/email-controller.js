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
		subject: `Welcome to the CKCA 🤝`,
		body: `
            <div style="font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
                    <img src="https://res.cloudinary.com/suvishakha/image/upload/v1716440742/centralkolkata.org/logo2/ckca_mqebff.png" alt="CKCA Logo" style="max-height: 80px; margin-bottom: 20px;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Welcome to the CKCA</h1>
                    <div style="width: 50px; height: 3px; background-color: #fbbf24; margin: 20px auto 0;"></div>
                </div>

                <!-- Body -->
                <div style="padding: 40px; color: #1f2937; line-height: 1.6;">
                    <p style="font-size: 18px; font-weight: 600; margin-bottom: 24px;">Dear ${member.name},</p>
                    
                    <p style="margin-bottom: 20px;">It is our great pleasure to welcome you as a member of the <strong>Central Kolkata Chartered Accountants Association</strong>.</p>
                    
                    <p style="margin-bottom: 30px;">We are thrilled to have you join our community of professionals. As a member, you will have access to our upcoming events, professional networking opportunities, and regular updates from the association.</p>

                    <!-- Details Card -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                        <h3 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Your Membership Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; width: 140px;"><strong>Name:</strong></td>
                                <td style="padding: 8px 0; color: #1e293b;">${member.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;"><strong>Membership No:</strong></td>
                                <td style="padding: 8px 0; color: #1e293b;">${member.ckscMembershipNo || member.icaiMembershipNo || 'Pending'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;"><strong>Mobile no.</strong></td>
                                <td style="padding: 8px 0; color: #1e293b;">${member.mobile || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;"><strong>Mail ID-</strong></td>
                                <td style="padding: 8px 0; color: #1e293b;">${member.email}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- WhatsApp CTA -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <p style="margin-bottom: 15px; font-weight: 500;">Kindly join our WhatsApp Group</p>
                        <a href="https://chat.whatsapp.com/EMIJppt0Cf2FyzaVaHjiI2" style="display: inline-block; background-color: #25D366; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">Join WhatsApp Group</a>
                        <p style="margin-top: 10px; font-size: 13px; color: #94a3b8;"><a href="https://chat.whatsapp.com/EMIJppt0Cf2FyzaVaHjiI2" style="color: #3b82f6;">https://chat.whatsapp.com/EMIJppt0Cf2FyzaVaHjiI2</a></p>
                    </div>

                    <p style="margin-bottom: 30px;">We look forward to your active participation in our future activities. Should you have any questions or require assistance, please feel free to reach out to us.</p>

                    <div style="border-top: 1px solid #f1f5f9; padding-top: 25px;">
                        <p style="margin: 0; color: #64748b;">Warmest Regards,</p>
                        <p style="margin: 5px 0 0 0; font-weight: 700; color: #1e293b;">Managing Committee</p>
                        <p style="margin: 0; font-weight: 700; color: #1e293b;">Team CKCA</p>
                        <p style="margin: 15px 0 0 0; font-size: 13px; font-weight: 600; color: #475569;">CENTRAL KOLKATA CA CPE STUDY CIRCLE of EIRC of ICAI</p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="margin: 0; font-size: 14px; color: #94a3b8;">© 2026 CKCA</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #cbd5e1;">This is an automated welcome message.</p>
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
