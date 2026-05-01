const Member = require("../models/member-model");
const axios = require("axios");
const moment = require("moment");

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

	const brevoApiUrl = "https://api.brevo.com/v3/smtp/email";
	const response = await axios.post(brevoApiUrl, payload, {
		headers: {
			'accept': 'application/json',
			'api-key': process.env.BREVO_API_KEY,
			'content-type': 'application/json',
		},
		timeout: 15000,
	});

	return response.data;
};

const sendBirthdayEmail = async (member) => {
    const emailObject = {
        email: member.email,
        subject: `Happy Birthday, ${member.name}! 🎂`,
        body: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Happy Birthday!</h1>
                    <p style="font-size: 50px; margin: 10px 0 0 0;">🎂</p>
                </div>
                <div style="padding: 40px 30px; text-align: center; background-color: #ffffff;">
                    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear <b>${member.name}</b>,</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        On behalf of the <b>Central Kolkata Chartered Accountants Association</b>, we wish you a day filled with laughter, joy, and the company of your loved ones.
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        May this new year of your life bring you abundant happiness, success, and good health.
                    </p>
                    <div style="margin: 30px 0; height: 1px; background-color: #eee;"></div>
                    <p style="font-size: 14px; color: #888;">Warmest Regards,</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold; margin-top: 5px;">Central Kolkata Chartered Accountants Association</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} Central Kolkata Chartered Accountants Association
                </div>
            </div>
        `
    };
    try {
        await deliverEmailViaBrevo(emailObject);
        console.log(`Birthday greeting sent to ${member.email}`);
    } catch (error) {
        console.error(`Failed to send birthday greeting to ${member.email}:`, error.message);
    }
};

const sendAnniversaryEmail = async (member) => {
    const emailObject = {
        email: member.email,
        subject: `Happy Anniversary, ${member.name}! 🥂`,
        body: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">Happy Anniversary!</h1>
                    <p style="font-size: 50px; margin: 10px 0 0 0;">🥂</p>
                </div>
                <div style="padding: 40px 30px; text-align: center; background-color: #ffffff;">
                    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear <b>${member.name}</b>,</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        Wishing you and your spouse a very Happy Anniversary!
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        May your journey together continue to be filled with love, companionship, and endless happiness.
                    </p>
                    <div style="margin: 30px 0; height: 1px; background-color: #eee;"></div>
                    <p style="font-size: 14px; color: #888;">Warmest Regards,</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold; margin-top: 5px;">Central Kolkata Chartered Accountants Association</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} Central Kolkata Chartered Accountants Association
                </div>
            </div>
        `
    };
    try {
        await deliverEmailViaBrevo(emailObject);
        console.log(`Anniversary greeting sent to ${member.email}`);
    } catch (error) {
        console.error(`Failed to send anniversary greeting to ${member.email}:`, error.message);
    }
};

const sendGreetings = async () => {
    try {
        const today = moment();
        const month = today.month() + 1; // 1-12
        const day = today.date();

        console.log(`Running greeting service for ${today.format('DD-MMM-YYYY')}...`);

        // Birthday Greetings
        const birthdayMembers = await Member.find({
            status: 'active',
            $expr: {
                $and: [
                    { $eq: [{ $month: "$dob" }, month] },
                    { $eq: [{ $dayOfMonth: "$dob" }, day] }
                ]
            }
        });

        for (const member of birthdayMembers) {
            if (member.email) {
                await sendBirthdayEmail(member);
            }
        }

        // Anniversary Greetings
        const anniversaryMembers = await Member.find({
            status: 'active',
            $expr: {
                $and: [
                    { $eq: [{ $month: "$dateOfAnniversary" }, month] },
                    { $eq: [{ $dayOfMonth: "$dateOfAnniversary" }, day] }
                ]
            }
        });

        for (const member of anniversaryMembers) {
            if (member.email) {
                await sendAnniversaryEmail(member);
            }
        }

        console.log(`Greeting service completed. Sent ${birthdayMembers.length} birthdays and ${anniversaryMembers.length} anniversaries.`);
        return { success: true, birthdays: birthdayMembers.length, anniversaries: anniversaryMembers.length };
    } catch (error) {
        console.error('Error in greeting service:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendGreetings };
