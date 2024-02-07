class DatabaseError extends Error
{
	constructor(message)
	{
		super(message);

		this.name = "DatabaseError";
		this.statusCode = 500; // Internal Server Error
	}
}

class NotFoundError extends Error
{
	constructor(message)
	{
		super(message);

		this.name = "NotFoundError";
		this.statusCode = 404; // Not Found
	}
}

class ValidationError extends Error
{
	constructor(message)
	{
		super(message);

		this.name = "ValidationError";
		this.statusCode = 400; // Bad Request
	}
}

module.exports = { DatabaseError, NotFoundError, ValidationError };
