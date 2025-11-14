const express = require("express");
const { chatWithModel, getSessionMessages, getUserSessions, addMessage, clearAllChats, createChat, deleteChat } = require("../controllers/chatController");

const router = express.Router();

router.post("/model", chatWithModel);
router.post('/sync-chats', createChat);
router.get('/sessions', getUserSessions);
router.get('/messages', getSessionMessages);
router.post('/messages', addMessage);
router.delete('/session/:sessionId', deleteChat);
router.delete('/clear/:userId', clearAllChats);

module.exports = router;
