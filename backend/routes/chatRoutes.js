const express = require("express");
const { chatWithModel } = require("../controllers/chatController");

const router = express.Router();

router.post("/chat", chatWithModel);

module.exports = router;
