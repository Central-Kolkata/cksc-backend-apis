const express = require("express");
const router = express.Router();
const { createAdminUser, initiatePasswordReset, verifyResetToken, setNewPassword, loginAdminUser } = require("../controllers/admin-user-controller");
const authenticateJWT = require("../middlewares/auth-middleware");

// Public endpoints (no JWT required)
router.post("/login", loginAdminUser);
router.post("/reset/initiate", initiatePasswordReset);
router.get("/reset/:token/verify", verifyResetToken);
router.post("/reset/:token", setNewPassword);

// Protect all other admin user routes with JWT
router.use(authenticateJWT);

// ... add more protected admin routes here ...
router.post("/", createAdminUser);

module.exports = router; 
