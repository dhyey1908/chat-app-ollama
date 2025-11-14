const http = require('http');
const { getSessionMessages, getUserSessions, addMessage, clearAllChats, createChat, deleteChat } = require('../service/chatService');

exports.chatWithModel = async (req, res) => {
  const { model, messages, temperature, max_tokens } = req.body;
  console.log('req.body: ', req.body);

  if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Model and messages are required' });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  const options = {
    hostname: 'localhost',
    port: 11434,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  const requestData = JSON.stringify({
    model,
    messages: messages.map(m => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.text
    })),
    temperature: temperature || 0.7,
    max_tokens: max_tokens || 200,
    stream: true
  });

  const ollamaReq = http.request(options, (ollamaRes) => {
    ollamaRes.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(l => l.trim() !== '');
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.message && obj.message.content) {
            res.write(JSON.stringify({ content: obj.message.content }) + '\n');
          }
        } catch (err) {
          console.error('Failed to parse line:', line);
        }
      }
    });

    ollamaRes.on('end', () => {
      res.end();
    });
  });

  ollamaReq.on('error', (err) => {
    res.status(500).json({ error: 'Ollama request failed', details: err.message });
  });

  ollamaReq.write(requestData);
  ollamaReq.end();
};

exports.createChat = async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const result = await createChat(userId, title || 'New Chat');
    if (!result || !result.success) {
      console.error('createChat service returned error:', result && result.error);
      return res.status(500).json({ error: result?.error || 'Failed to create chat session' });
    }
    res.json({ success: true, chat: result.data });
  } catch (err) {
    console.error('createChat error:', err);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await getUserSessions(userId);
    if (!result || !result.success) {
      console.error('getUserSessions service returned error:', result && result.error);
      return res.status(500).json({ error: result?.error || 'Failed to fetch sessions' });
    }
    res.json(result.data);
  } catch (err) {
    console.error('getUserSessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

exports.getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const result = await getSessionMessages(sessionId);
    if (!result || !result.success) {
      console.error('getSessionMessages service returned error:', result && result.error);
      return res.status(500).json({ error: result?.error || 'Failed to fetch messages' });
    }
    res.json(result.data);
  } catch (err) {
    console.error('getSessionMessages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { sessionId, sender, text } = req.body;
    if (!sessionId || !sender || !text)
      return res.status(400).json({ error: 'Missing required fields' });

    const result = await addMessage(sessionId, sender, text);
    if (!result || !result.success) {
      console.error('addMessage service returned error:', result && result.error);
      return res.status(500).json({ error: result?.error || 'Failed to add message' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('addMessage error:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await deleteChat(sessionId);
    if (!result || !result.success) {
      console.error('deleteChat service returned error:', result && result.error);
      return res.status(500).json({ error: result?.error || 'Failed to delete chat' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('deleteChat error:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

exports.clearAllChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await clearAllChats(userId);
    if (!result || !result.success) {
      console.error('clearAllChats service returned error:', result && result.error);
      return res.status(500).json({ error: result?.error || 'Failed to clear chats' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('clearAllChats error:', err);
    res.status(500).json({ error: 'Failed to clear chats' });
  }
};

