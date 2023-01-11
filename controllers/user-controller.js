const asyncHandler = require("express-async-handler");
const User = require("../models/user-model");
const userPayment = require("../models/user-payment");

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
	res.status(200).json({ message: "User Updated Successfully" });
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

const fetchUserTransactions = asyncHandler(async (req, res) =>
{
	let find_query = {};

	if (req.query.userId)
	{
		find_query.userId = req.query.userId;
	}

	var transactionData = await userPayment.find(find_query).populate("paymentRequestId paymentResponseId userId").sort({ _id: -1 }).lean();

	for (let index in transactionData)
	{
		transactionData[index].paymentStatus = transactionData[index].paymentStatus.includes("Failed") ? "FAILURE" : "SUCCESS";
		transactionData[index].statusBg = transactionData[index].paymentStatus == "FAILURE" ? "#FF5C8E" : "#8BE78B";
	}

	res.status(200).json({ message: "Transactions Data fetched Successfully", response: transactionData });
});

const getDashboardData = asyncHandler(async (req, res) =>
{
	const totalUsers = await User.find().countDocuments();

	const userPaymentData = await userPayment.find({ paymentStatus: { $in: ["Init -> Transaction successful", "SUCCESS"] } }).populate("paymentResponseId");

	let totalPaymentReceived = 0;

	for(let index in userPaymentData) {
		if (!userPaymentData[index]["paymentResponseId"]["transactionMessage"].includes("Failed")) {
			totalPaymentReceived += userPaymentData[index]["paymentResponseId"]["amount"];
		}
	}

	const totalPendingAmount = await User.aggregate([
		{
			$match: { pendingAmount: { $ne: 0 } }
		},
		{
			$group: {
				_id: null,
				totalPendingAmount: { $sum: "$pendingAmount"},
			}
		}
	]);

	const response = {
		totalUsers: totalUsers,
		totalPaymentReceived: totalPaymentReceived,
		totalPendingAmount: totalPendingAmount[0]["totalPendingAmount"]
	};

	res.status(200).json({ message: "Dashboard Data fetched Successfully", response: response });
});

const fetchAllPendingAmounts = asyncHandler(async (req, res) =>
{
	const find_query = { pendingAmount: { $ne: 0 } };

	const pendingAmounts = await User.find(find_query);

	res.status(200).json({ message: "Total Pending Amounts fetched Successfully", response: pendingAmounts });
});

module.exports =
{
	fetchUsers, createUser, createUsers, fetchPendingAmount, updateUser, deleteUser, fetchUserTransactions, getDashboardData, fetchAllPendingAmounts
};
