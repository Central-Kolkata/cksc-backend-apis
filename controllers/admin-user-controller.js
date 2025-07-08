const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const AdminUser = require("../models/admin-user");
const crypto = require("crypto");
const { sendCKCAEmail } = require("./email-controller");
const jwt = require("jsonwebtoken");

// Create a new admin user
const createAdminUser = asyncHandler(async (req, res) =>
{
	const { username, email, password } = req.body;
	if (!username || !email || !password)
	{
		res.status(400);
		throw new Error("Username, email, and password are required");
	}
	const existingUser = await AdminUser.findOne({ $or: [{ username }, { email }] });
	if (existingUser)
	{
		res.status(409);
		throw new Error("Username or email already exists");
	}
	const hashedPassword = await bcrypt.hash(password, 10);
	const adminUser = await AdminUser.create({ username, email, password: hashedPassword });
	res.status(201).json({ id: adminUser._id, username: adminUser.username, email: adminUser.email });
});

// Initiate password reset or set password (send token link)
const initiatePasswordReset = asyncHandler(async (req, res) =>
{
	const { username } = req.body;
	const adminUser = await AdminUser.findOne({ username });
	if (!adminUser)
	{
		res.status(404);
		throw new Error("Admin user not found");
	}
	const token = crypto.randomBytes(32).toString("hex");
	const expires = Date.now() + 1000 * 60 * 60; // 1 hour
	adminUser.resetPasswordToken = token;
	adminUser.resetPasswordExpires = new Date(expires);
	await adminUser.save();
	// Compose email content
	const resetLink = `${process.env.FRONTEND_BASE_URL || "http://localhost:3000"}/admin/reset-password/${token}`;
	const emailObject = {
		email: adminUser.email,
		subject: "CKCA Admin Password Reset",
		body: `<p>Dear ${adminUser.username},</p><p>You requested a password reset for your CKCA admin account.</p><p>Please click the link below to set a new password. This link will expire in 1 hour.</p><p><a href='${resetLink}'>Reset Password</a></p><p>If you did not request this, please ignore this email.</p><p>Regards,<br/>CKCA Team</p>`
	};
	// Send email using CKCA email controller
	await sendCKCAEmail({ body: { emailObject } }, { send: () => { }, status: () => ({ json: () => { } }) });
	res.json({ message: "Password reset/set link sent to admin email." });
});

// Verify reset/set password token
const verifyResetToken = asyncHandler(async (req, res) =>
{
	const { token } = req.params;
	const adminUser = await AdminUser.findOne({
		resetPasswordToken: token,
		resetPasswordExpires: { $gt: new Date() }
	});
	if (!adminUser)
	{
		res.status(400);
		throw new Error("Invalid or expired token");
	}
	res.json({ message: "Token is valid." });
});

// Set new password (using token)
const setNewPassword = asyncHandler(async (req, res) =>
{
	const { token } = req.params;
	const { password } = req.body;
	const adminUser = await AdminUser.findOne({
		resetPasswordToken: token,
		resetPasswordExpires: { $gt: new Date() }
	});
	if (!adminUser)
	{
		res.status(400);
		throw new Error("Invalid or expired token");
	}
	adminUser.password = await bcrypt.hash(password, 10);
	adminUser.resetPasswordToken = null;
	adminUser.resetPasswordExpires = null;
	await adminUser.save();
	res.json({ message: "Password has been set/reset successfully." });
});

// Login admin user and return JWT access token
const loginAdminUser = asyncHandler(async (req, res) =>
{
	const { username, email, password } = req.body;
	if ((!username && !email) || !password)
	{
		res.status(400);
		throw new Error("Username or email and password are required");
	}
	const adminUser = await AdminUser.findOne(username ? { username } : { email });
	if (!adminUser)
	{
		res.status(401);
		throw new Error("Invalid credentials");
	}
	const isMatch = await bcrypt.compare(password, adminUser.password);
	if (!isMatch)
	{
		res.status(401);
		throw new Error("Invalid credentials");
	}
	const token = jwt.sign(
		{ id: adminUser._id, username: adminUser.username, email: adminUser.email },
		process.env.JWT_SECRET,
		{ expiresIn: "1h" }
	);
	res.json({ accessToken: token });
});

module.exports = {
	createAdminUser,
	initiatePasswordReset,
	verifyResetToken,
	setNewPassword,
	loginAdminUser
}; 
