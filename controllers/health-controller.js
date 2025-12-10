// health-controller.js

const express = require('express');
const router = express.Router();

// GET /health
router.get('/', (req, res) =>
{
	res.status(200).json({ 
		status: 'ok', 
		message: 'CKSC backend is CI/CD enabled - Github copilot helped!',
		timestamp: new Date().toISOString(),
		deployedAt: '2025-12-10T22:10:00Z'
	});
});

module.exports = router;
