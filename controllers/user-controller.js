const asyncHandler = require("express-async-handler");
const User = require("../models/user-model");
const axios = require("axios");

const fetchUsers = asyncHandler(async (req, res) =>
{
	const users = await User.find();

	res.status(200).json(
		{
			users
		});
});

const createUser = asyncHandler(async (req, res) =>
{
	const user = await User.create(req.body);

	res.status(201).json(
		{
			user
		});
});

const createUsers = asyncHandler(async (req, res) =>
{
	const users = await User.insertMany(req.body);

	res.status(201).json(
		{
			users
		});
});

const updateUser = asyncHandler(async (req, res) =>
{
	const user = await User.findByIdAndUpdate(req.params.id);

	if (!user)
	{
		res.status(400);
		throw new Error("User not found");
	}

	const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
	res.status(200).json(updatedUser);
});

const deleteUser = asyncHandler(async (req, res) =>
{
	const user = await User.findByIdAndUpdate(req.params.id);

	if (!user)
	{
		res.status(400);
		throw new Error("User not found");
	}

	await user.remove();

	res.status(200).json(
		{
			id: req.params.id
		});
});

const fetchPendingAmount = asyncHandler(async (req, res) =>
{
	const user = await User.find({ icaiMembershipNo: req.params.icaiMembershipNo });

	res.status(200).json(
		{
			user
		}
	);
});

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
	fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser, sendSMS
};
