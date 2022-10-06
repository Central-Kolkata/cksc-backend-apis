const express = require("express");
const dotenv = require("dotenv").config();
const { errorHandler } = require("./middlewares/error-middleware");
const connectMongoDB = require("./config/db");

connectMongoDB();
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(`/api/users`, require("./routes/user-routes"));
app.use(`/api/atom`, require("./routes/atom-routes"));

app.use(errorHandler);

app.use((req, res, next) =>
{
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, OPTIONS, PUT, PATCH, DELETE",
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, Accept-Language",
	);
});

app.listen(port, () =>
{
	console.log(`Server started on port ${port}`);
});
