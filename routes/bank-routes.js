const express = require("express");
const router = express.Router();
const { fetchOneTimePaymentRequestURL, receiveOneTimePaymentResponse, fetchPaymentRequestURL, receivePaymentResponse, verifyTransaction, getNextCKSCMembershipNo, registerOneTimeMember } = require("../controllers/bank-controller");

router.route(`/fetchPaymentRequestURL`).post(fetchPaymentRequestURL);
router.route(`/receivePaymentResponse`).post(receivePaymentResponse);
router.route(`/fetchOneTimePaymentRequestURL`).post(fetchOneTimePaymentRequestURL);
router.route(`/receiveOneTimePaymentResponse`).post(receiveOneTimePaymentResponse);
router.route(`/registerOneTimeMember`).post(registerOneTimeMember);
router.route(`/`).get(getNextCKSCMembershipNo);

module.exports = router;
