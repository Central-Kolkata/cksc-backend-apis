const express = require("express");
const router = express.Router();
const { sendWhatsAppMessage } = require("../controllers/whatsapp-controller");

router.route(`/sendWhatsAppMessage`).post(sendWhatsAppMessage);

module.exports = router;
