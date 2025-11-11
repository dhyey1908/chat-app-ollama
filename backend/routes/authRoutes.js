const express = require("express");
const { signup, confirmUser, login, googleToken, forgotPassword, confirmForgotPassword } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/confirmUser", confirmUser);
router.post("/login", login);
router.post("/google/token", googleToken);
router.post("/forgot-password", forgotPassword);
router.post("/confirm-forgot-password", confirmForgotPassword);

module.exports = router;
