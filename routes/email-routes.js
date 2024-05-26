const express = require("express");
const router = express.Router();
const { sendCKCAEmail, sendEmailForAKP } = require("../controllers/email-controller");

router.route(`/sendCKCAEmail`).post(sendCKCAEmail);
router.route(`/sendEmailForAKP`).post(sendEmailForAKP);

module.exports = router;
