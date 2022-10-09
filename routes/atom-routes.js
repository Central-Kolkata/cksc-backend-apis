const express = require("express");
const router = express.Router();
const { createPaymentRequest, receivePaymentResponse, verifyPayment } = require("../controllers/atom-controller");

router.route(`/createPaymentRequest/`).post(createPaymentRequest);
router.route(`/receivePaymentResponse`).post(receivePaymentResponse);
router.route(`/verifyPayment`).post(verifyPayment);

module.exports = router;
