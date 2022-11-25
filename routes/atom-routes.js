const express = require("express");
const router = express.Router();
const { fetchPaymentRequestURL, receivePaymentResponse, requeryTransaction } = require("../controllers/atom-controller");

router.route(`/fetchPaymentRequestURL`).post(fetchPaymentRequestURL);
router.route(`/receivePaymentResponse`).post(receivePaymentResponse);
router.route(`/requeryTransaction`).post(requeryTransaction);

module.exports = router;
