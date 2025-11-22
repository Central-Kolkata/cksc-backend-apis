const express = require("express");
const dotenv = require("dotenv").config();
const { errorHandler } = require("./middlewares/error-middleware");
const connectMongoDB = require("./config/db");
const cors = require("cors");
const authenticateJWT = require('./middlewares/auth-middleware');

connectMongoDB();
const port = process.env.PORT || 5001;
const app = express();

// Whitelist: login, reset, and ICICI bank response endpoints
const jwtWhitelist = [
	'/api/admin-users/login',
	'/api/admin-users/reset/initiate',
	/^\/api\/admin-users\/reset\/[^/]+\/verify$/, // regex for /api/admin-users/reset/:token/verify
	/^\/api\/admin-users\/reset\/[^/]+$/,         // regex for /api/admin-users/reset/:token
	'/api/bank/receiveOneTimePaymentResponse',
	'/api/bank/receivePaymentResponse',
	'/api/events/fetchUpcomingEvents',
	/^\/api\/members\/fetchPendingAmount\/[^/]+\/[^/]+$/, // regex for /api/members/fetchPendingAmount/:param1/:param2
	'/api/bank/fetchOneTimePaymentRequestURL',
	'/api/bank/registerOneTimeMember'
];

app.use(cors());
app.use((req, res, next) =>
{
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, OPTIONS, PUT, PATCH, DELETE"
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, Accept-Language"
	);
	next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));


app.use((req, res, next) =>
{
	const path = req.path;
	const isWhitelisted = jwtWhitelist.some((route) =>
		route instanceof RegExp ? route.test(path) : route === path
	);
	// Allow /api/emailService/sendCKCAEmail and /api/emailService/sendEmailForAKP if Origin/Referer is centralkolkata.org
	const allowedEmailPaths = [
		'/api/emailService/sendCKCAEmail',
		'/api/emailService/sendEmailForAKP'
	];
	if (isWhitelisted)
	{
		return next();
	}
	if (allowedEmailPaths.includes(path))
	{
		const origin = req.get('origin') || req.get('referer') || '';
		if (origin.includes('centralkolkata.org'))
		{
			return next();
		}
	}
	return authenticateJWT(req, res, next);
});

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
app.use(`/api/admin-users`, require("./routes/admin-user-routes"));

app.use(errorHandler);

app.listen(port, () =>
{
	console.log(`Server started on port ${port}`);
});
