const express = require("express");
const router = express.Router();
const { sendCKCAEmail, sendEmailForAKP, sendCKCAEmailResend } = require("../controllers/email-controller");

router.route(`/sendCKCAEmail`).post(sendCKCAEmail);
router.route(`/sendCKCAEmailResend`).post(sendCKCAEmailResend);
router.route(`/sendEmailForAKP`).post(sendEmailForAKP);

module.exports = router;
