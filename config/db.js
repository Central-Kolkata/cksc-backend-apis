const mongoose = require("mongoose");

const connectMongoDB = async () =>
{
	try
	{
		const conn = await mongoose.connect(process.env.MONGO_URI);
		console.log(`Mongo connection successful: ${conn.connection.host}`);
	}
	catch (error)
	{
		console.log(error);
		process.exit(1);
	}
};

module.exports = connectMongoDB;
