const express = require("express");
const router = express.Router();
const { fetchAllPaymentDetails, fetchAllMembers, fetchEmailLogs } = require("../controllers/reports-controller");

router.route(`/fetchAllPaymentDetails`).get(fetchAllPaymentDetails);
router.route(`/fetchAllMembers`).get(fetchAllMembers);
router.route(`/fetchEmailLogs`).get(fetchEmailLogs);

module.exports = router;
