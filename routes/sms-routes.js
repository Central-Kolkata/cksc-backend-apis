const express = require("express");
const router = express.Router();
const { sendSMS } = require("../controllers/sms-controller");

router.route(`/sendSMS`).post(sendSMS);

module.exports = router;
