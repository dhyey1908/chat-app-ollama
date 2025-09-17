const http = require('http');

exports.chatWithModel = async (req, res) => {
  const { model, messages, temperature, max_tokens } = req.body;

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
