const express = require("express");
const router = express.Router();
const { fetchTransactions } = require("../controllers/transaction-controller");

router.route(`/`).get(fetchTransactions);

module.exports = router;
