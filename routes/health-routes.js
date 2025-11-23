// health-routes.js

const express = require('express');
const router = express.Router();

const healthController = require('../controllers/health-controller');

// Mount the health controller at /
router.use('/', healthController);

module.exports = router;
