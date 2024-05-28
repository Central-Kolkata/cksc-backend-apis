const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const cloudinary = require('../config/cloudinary-config');
const upload = require("../config/multer-config");

const uploadFile = asyncHandler(async (req, res) =>
{
	if (!req.file)
	{
		return res.status(400).send('No file uploaded.');
	}

	try
	{
		const result = await cloudinary.uploader.upload_stream(
			{ resource_type: 'auto' },
			(error, result) =>
			{
				if (error)
				{
					return res.status(500).send(error);
				}

				res.status(200).json({ url: result.secure_url });
			}
		).end(req.file.buffer);
	}
	catch (error)
	{
		res.status(500).json({ error: error.message });
	}
});

module.exports =
{
	uploadFile
};
