const express = require("express");
const router = express.Router();
const { sendCKCAEmail, sendEmailForAKP, sendCKCAEmailResend, sendWelcomeEmail } = require("../controllers/email-controller");

router.route(`/sendCKCAEmail`).post(sendCKCAEmail);
router.route(`/sendCKCAEmailResend`).post(sendCKCAEmailResend);
router.route(`/sendEmailForAKP`).post(sendEmailForAKP);
router.route(`/sendWelcomeEmail`).post(sendWelcomeEmail);

module.exports = router;
