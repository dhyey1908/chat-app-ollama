const express = require("express");
const { signup, confirmUser, login, googleToken, forgotPassword, confirmForgotPassword, getUserId, logout } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/confirmUser", confirmUser);
router.post("/login", login);
router.post("/google/token", googleToken);
router.post('/logout', logout);
router.post("/forgot-password", forgotPassword);
router.post("/confirm-forgot-password", confirmForgotPassword);
router.get('/userId', getUserId);

module.exports = router;
