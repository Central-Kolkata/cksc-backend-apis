const asyncHandler = require("express-async-handler");
const User = require("../models/user-model");
const axios = require("axios");

const fetchUsers = asyncHandler(async (req, res) =>
{
	const users = await User.find();

	res.status(200).json({ users });
});

const createUser = asyncHandler(async (req, res) =>
{
	const user = await User.create(req.body);

	res.status(201).json({ user });
});

const createUsers = asyncHandler(async (req, res) =>
{
	await User.insertMany(req.body);

	res.status(201).json({ message: "User Created Successfully" });
});

const updateUser = asyncHandler(async (req, res) =>
{
	const user = await User.findByIdAndUpdate(req.params.id);

	if (!user)
	{
		res.status(400);
		throw new Error("User not found");
	}

	await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
	res.status(200).json({ message: "User details successfully updated!" });
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

	res.status(200).json({ message: "User Deleted Successfully" });
});

const fetchPendingAmount = asyncHandler(async (req, res) =>
{
	const user = await User.findOne({ icaiMembershipNo: req.params.icaiMembershipNo });

	res.status(200).json(
		{
			message: "Data fetched Successfully",
			response: user
		}
	);
});

module.exports =
{
	fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser
};
