const express = require("express");
const { signup, confirmUser, login } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/confirmUser", confirmUser);
router.post("/login", login);

module.exports = router;
