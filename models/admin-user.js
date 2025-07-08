const mongoose = require("mongoose");

const adminUserSchema = mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, "Username is mandatory"],
			unique: true
		},
		password: {
			type: String,
			required: [true, "Password is mandatory"]
		},
		email: {
			type: String,
			required: [true, "Email is mandatory"],
			unique: true
		},
		resetPasswordToken: {
			type: String,
			default: null
		},
		resetPasswordExpires: {
			type: Date,
			default: null
		}
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model("AdminUser", adminUserSchema); 
