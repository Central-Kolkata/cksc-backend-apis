const express = require("express");
const router = express.Router();
const { createAdminUser, initiatePasswordReset, verifyResetToken, setNewPassword } = require("../controllers/admin-user-controller");

router.post("/", createAdminUser);
router.post("/reset/initiate", initiatePasswordReset);
router.get("/reset/:token/verify", verifyResetToken);
router.post("/reset/:token", setNewPassword);

module.exports = router; 
