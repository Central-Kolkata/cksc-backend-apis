const express = require("express");
const router = express.Router();
const { fetchPaymentRequestURL, receivePaymentResponse, fetchRequeryURL, createRequeryRequest, receiveRequeryResponse } = require("../controllers/atom-controller");

router.route(`/fetchPaymentRequestURL`).post(fetchPaymentRequestURL);
router.route(`/receivePaymentResponse`).post(receivePaymentResponse);
router.route(`/fetchRequeryURL`).post(fetchRequeryURL);
router.route(`/createRequeryRequest`).post(createRequeryRequest);
router.route(`/receiveRequeryResponse`).post(receiveRequeryResponse);

module.exports = router;
