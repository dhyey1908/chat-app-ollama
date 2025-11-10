const express = require("express");
const { signup, confirmUser, login, googleToken } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/confirmUser", confirmUser);
router.post("/login", login);
router.post("/google/token", googleToken)

module.exports = router;
