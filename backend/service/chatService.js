const db = require('../db/connection');

exports.createChat = async (userId, title) => {
    try {
        await db.query(
            'INSERT INTO chat_sessions (id, user_id, title) VALUES (UUID(), ?, ?)',
            [userId, title]
        );
        const [session] = await db.query(
            'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [userId]
        );
        return { success: true, data: session[0], message: "Chat created successfully." };
    } catch (error) {
        console.error('createChat Service Error:', error);
        return { success: false, error: error?.message || 'Failed to create chat' };
    }
};

exports.getUserSessions = async (userId) => {
    try {
        const [sessions] = await db.query(
            'SELECT id, title, created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return { success: true, data: sessions || [], message: "User sessions retrieved successfully." };
    } catch (error) {
        console.error('getUserSessions Service Error:', error);
        return { success: false, error: error?.message || 'Failed to fetch sessions' };
    }
};

exports.getSessionMessages = async (sessionId) => {
    try {
        const [messages] = await db.query(
            'SELECT sender AS `from`, text, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
            [sessionId]
        );
        return { success: true, data: messages || [], message: "Session messages retrieved successfully." };
    } catch (error) {
        console.error('getSessionMessages Service Error:', error);
        return { success: false, error: error?.message || 'Failed to fetch messages' };
    }
};

exports.addMessage = async (sessionId, sender, text) => {
    try {
        await db.query(
            'INSERT INTO messages (id, session_id, sender, text) VALUES (UUID(), ?, ?, ?)',
            [sessionId, sender, text]
        );
        return { success: true, message: "Message added successfully." };
    } catch (error) {
        console.error('addMessage Service Error:', error);
        return { success: false, error: error?.message || 'Failed to add message' };
    }
};

exports.deleteChat = async (sessionId) => {
    try {
        await db.query('DELETE FROM messages WHERE session_id = ?', [sessionId]);
        await db.query('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);
        return { success: true, message: "Chat deleted successfully." };
    } catch (error) {
        console.error('deleteChat Service Error:', error);
        return { success: false, error: error?.message || 'Failed to delete chat' };
    }
};

exports.clearAllChats = async (userId) => {
    try {
        await db.query(
            `DELETE m FROM messages m
         JOIN chat_sessions s ON m.session_id = s.id
         WHERE s.user_id = ?`,
            [userId]
        );
        await db.query('DELETE FROM chat_sessions WHERE user_id = ?', [userId]);
        return { success: true, message: "All chats cleared successfully." };
    } catch (error) {
        console.error('clearAllChats Service Error:', error);
        return { success: false, error: error?.message || 'Failed to clear chats' };
    }
};
