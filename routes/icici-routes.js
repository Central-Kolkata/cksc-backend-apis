const express = require("express");
const router = express.Router();
const { fetchEncryptedRequestParams, fetchPaymentRequestURL, receivePaymentResponse, verifyTransaction } = require("../controllers/icici-controller");

router.route(`/fetchEncryptedRequestParams`).post(fetchEncryptedRequestParams);
router.route(`/fetchPaymentRequestURL`).post(fetchPaymentRequestURL);
router.route(`/receivePaymentResponse`).post(receivePaymentResponse);
router.route(`/verifyTransaction`).post(verifyTransaction);

module.exports = router;
