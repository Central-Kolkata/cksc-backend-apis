const express = require("express");
const dotenv = require("dotenv").config();
const { errorHandler } = require("./middlewares/error-middleware");
const mongoDB = require("./config/db");

mongoDB();
const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", (req, res) => res.json("OK"));
app.use(`/api/users`, require("./routes/user-routes"));
app.use(`/api/atom`, require("./routes/atom-routes"));

app.use(errorHandler);
app.listen(port, () =>
{
	console.log(`Server started on port ${port}`);
});
