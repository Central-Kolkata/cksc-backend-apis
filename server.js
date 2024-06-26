const express = require("express");
const dotenv = require("dotenv").config();
const { errorHandler } = require("./middlewares/error-middleware");
const connectMongoDB = require("./config/db");
const cors = require("cors");

connectMongoDB();
const port = process.env.PORT || 5001;
const app = express();

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

	next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(`/api/members`, require("./routes/member-routes"));
// app.use(`/api/atom`, require("./routes/atom-routes"));
app.use(`/api/icici`, require("./routes/icici-routes"));
app.use(`/api/bank`, require("./routes/bank-routes"));
app.use(`/api/sms`, require("./routes/sms-routes"));
app.use(`/api/whatsapp`, require("./routes/whatsapp-routes"));
app.use(`/api/reports`, require("./routes/reports-routes"));
app.use(`/api/transactions`, require("./routes/transaction-routes"));
app.use(`/api/events`, require("./routes/event-routes"));
app.use(`/api/emailService`, require("./routes/email-routes"));
app.use(`/api/upload`, require("./routes/upload-routes"));

app.use(errorHandler);

app.listen(port, () =>
{
	console.log(`Server started on port ${port}`);
});
