const express = require("express");
const router = express.Router();
const { sendEmail } = require("../controllers/email-controller");

router.route(`/sendEmail`).post(sendEmail);

module.exports = router;
