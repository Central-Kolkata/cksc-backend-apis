const express = require("express");
const router = express.Router();
const { fetchAllPaymentDetails, fetchAllMembers } = require("../controllers/reports-controller");

router.route(`/fetchAllPaymentDetails`).get(fetchAllPaymentDetails);
router.route(`/fetchAllMembers`).get(fetchAllMembers);

module.exports = router;
