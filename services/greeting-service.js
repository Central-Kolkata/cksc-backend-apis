const Member = require("../models/member-model");
const EmailLog = require("../models/email-log-model");
const axios = require("axios");
const moment = require("moment");
const { sendCKCAEmailViaResend, deliverEmailViaBrevo } = require("../controllers/email-controller");

const sendBirthdayEmail = async (member) => {
    const emailObject = {
        email: member.email,
        subject: `Happy Birthday, ${member.name}! 🪔`,
        body: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ffcc80; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #f57c00 0%, #ffb74d 100%); padding: 40px 20px; text-align: center; color: white;">
                    <p style="font-size: 50px; margin: 0;">🪔</p>
                    <h1 style="margin: 10px 0 0 0; font-size: 32px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Happy Birthday!</h1>
                    <p style="font-size: 18px; margin: 5px 0 0 0; opacity: 0.9;">Wishing you a bright and prosperous year ahead</p>
                </div>
                <div style="padding: 40px 30px; text-align: center; background-color: #ffffff;">
                    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear <b>${member.name}</b>,</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        Namaste! On this special day, the <b>Central Kolkata Chartered Accountants Association</b> sends you our warmest wishes. 
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        May your life be illuminated with joy, success, and good health, just like the glow of a Diya. We are proud to have you as part of our professional family.
                    </p>
                    <div style="margin: 30px 0; height: 1px; background-color: #ffe0b2;"></div>
                    <p style="font-size: 14px; color: #888;">Warmest Regards,</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold; margin-top: 5px;">Managing Committee</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold;">Central Kolkata Chartered Accountants Association</p>
                </div>
                <div style="background-color: #fff3e0; padding: 20px; text-align: center; font-size: 12px; color: #9e9e9e;">
                    © ${new Date().getFullYear()} Central Kolkata Chartered Accountants Association
                </div>
            </div>
        `
    };
    try {
        let result = await sendCKCAEmailViaResend(emailObject).catch(async (err) => {
            return await deliverEmailViaBrevo(emailObject);
        });

        await EmailLog.create({
            recipientEmail: member.email,
            recipientName: member.name,
            subject: emailObject.subject,
            emailType: 'birthday',
            serviceUsed: result.service,
            status: 'sent'
        });
        console.log(`Birthday greeting sent and logged for ${member.email} via ${result.service}`);
    } catch (error) {
        console.error(`Failed to send birthday greeting to ${member.email}:`, error.message);
        await EmailLog.create({
            recipientEmail: member.email,
            recipientName: member.name,
            subject: emailObject.subject,
            emailType: 'birthday',
            serviceUsed: 'none',
            status: 'failed',
            error: error.message
        });
    }
};

const sendAnniversaryEmail = async (member) => {
    const spouseDisplayName = member.spouseName ? ` & ${member.spouseName}` : " & spouse";
    const emailObject = {
        email: member.email,
        subject: `Happy Anniversary, ${member.name}${spouseDisplayName}! 🪷`,
        body: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f8bbd0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #d81b60 0%, #f48fb1 100%); padding: 40px 20px; text-align: center; color: white;">
                    <p style="font-size: 50px; margin: 0;">🪷</p>
                    <h1 style="margin: 10px 0 0 0; font-size: 32px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Happy Anniversary!</h1>
                    <p style="font-size: 18px; margin: 5px 0 0 0; opacity: 0.9;">Celebrating your beautiful journey together</p>
                </div>
                <div style="padding: 40px 30px; text-align: center; background-color: #ffffff;">
                    <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Dear <b>${member.name}${spouseDisplayName}</b>,</p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        Heartiest congratulations on your wedding anniversary! 
                    </p>
                    <p style="font-size: 16px; color: #555; line-height: 1.6;">
                        May the bond you share continue to grow stronger with each passing year, filled with endless love, peace, and togetherness.
                    </p>
                    <div style="margin: 30px 0; height: 1px; background-color: #fce4ec;"></div>
                    <p style="font-size: 14px; color: #888;">With Best Wishes,</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold; margin-top: 5px;">Managing Committee</p>
                    <p style="font-size: 16px; color: #333; font-weight: bold;">Central Kolkata Chartered Accountants Association</p>
                </div>
                <div style="background-color: #fce4ec; padding: 20px; text-align: center; font-size: 12px; color: #ad1457;">
                    © ${new Date().getFullYear()} Central Kolkata Chartered Accountants Association
                </div>
            </div>
        `
    };
    try {
        let result = await sendCKCAEmailViaResend(emailObject).catch(async (err) => {
            return await deliverEmailViaBrevo(emailObject);
        });

        await EmailLog.create({
            recipientEmail: member.email,
            recipientName: member.name,
            subject: emailObject.subject,
            emailType: 'anniversary',
            serviceUsed: result.service,
            status: 'sent'
        });
        console.log(`Anniversary greeting sent and logged for ${member.email} via ${result.service}`);
    } catch (error) {
        console.error(`Failed to send anniversary greeting to ${member.email}:`, error.message);
        await EmailLog.create({
            recipientEmail: member.email,
            recipientName: member.name,
            subject: emailObject.subject,
            emailType: 'anniversary',
            serviceUsed: 'none',
            status: 'failed',
            error: error.message
        });
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
