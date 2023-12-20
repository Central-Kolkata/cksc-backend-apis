const express = require("express");
const router = express.Router();
const { fetchAllPaymentDetails } = require("../controllers/reports-controller");

router.route(`/fetchAllPaymentDetails`).get(fetchAllPaymentDetails);

module.exports = router;
