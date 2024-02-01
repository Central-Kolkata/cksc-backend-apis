const express = require("express");
const router = express.Router();
const { fetchOneTimePaymentRequestURL, receiveOneTimePaymentResponse, fetchPaymentRequestURL, receivePaymentResponse, verifyTransaction, migrateData } = require("../controllers/icici-controller");

router.route(`/fetchPaymentRequestURL`).post(fetchPaymentRequestURL);
router.route(`/receivePaymentResponse`).post(receivePaymentResponse);
router.route(`/fetchOneTimePaymentRequestURL`).post(fetchOneTimePaymentRequestURL);
router.route(`/receiveOneTimePaymentResponse`).post(receiveOneTimePaymentResponse);
router.route(`/verifyTransaction`).post(verifyTransaction);
router.route(`/`).get(migrateData);

module.exports = router;
