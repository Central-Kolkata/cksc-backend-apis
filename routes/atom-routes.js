const express = require("express");
const router = express.Router();
const { createPaymentRequest, receivePaymentResponse } = require("../controllers/atom-controller");

router.route(`/createPaymentRequest`).get(createPaymentRequest);
router.route(`/receivePaymentResponse`).post(receivePaymentResponse);

module.exports = router;
