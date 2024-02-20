const express = require("express");
const router = express.Router();
const { fetchAllPaymentDetails, fetchAllUsers } = require("../controllers/reports-controller");

router.route(`/fetchAllPaymentDetails`).get(fetchAllPaymentDetails);
router.route(`/fetchAllUsers`).get(fetchAllUsers);

module.exports = router;
