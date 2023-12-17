const express = require("express");
const router = express.Router();
const { fetchPaymentRequestURL, receivePaymentResponse, verifyTransaction } = require("../controllers/icici-controller");

router.route(`/fetchPaymentRequestURL`).post(fetchPaymentRequestURL);
router.route(`/receivePaymentResponse`).get(receivePaymentResponse);
router.route(`/verifyTransaction`).post(verifyTransaction);

module.exports = router;
