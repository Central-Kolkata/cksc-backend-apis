const errorHandler = (err, req, res, next) =>
{
	// Use statusCode from error if available, else default to 500
	const statusCode = err.statusCode ? err.statusCode : 500;

	res.status(statusCode);
	res.json(
		{
			message: err.message,
			stack: process.env.NODE_ENV === "production" ? null : err.stack
		});
};

module.exports =
{
	errorHandler
};
