// health-routes.js

const express = require('express');
const router = express.Router();
const { sendGreetings } = require("../services/greeting-service");

const healthController = require('../controllers/health-controller');

// Mount the health controller at /
router.get('/', healthController);

// Manual trigger for testing greetings
router.get('/trigger-greetings', async (req, res) => {
    try {
        const result = await sendGreetings();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
