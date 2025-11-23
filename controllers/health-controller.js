// health-controller.js

const express = require('express');
const router = express.Router();

// GET /health
router.get('/', (req, res) =>
{
	res.status(200).json({ status: 'ok', message: 'CKSC backend is healthy and CICD enabled.' });
});

module.exports = router;
