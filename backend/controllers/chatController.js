const { spawn } = require("child_process");

exports.chatWithModel = (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Run ollama with the gemma3:270m model
    const ollama = spawn("ollama", ["run", "gemma3:270m"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    ollama.stdout.on("data", (data) => {
      output += data.toString();
    });

    ollama.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ollama.on("close", (code) => {
      if (code !== 0) {
        return res
          .status(500)
          .json({ error: "Ollama failed", details: errorOutput });
      }
      res.json({ response: output.trim() });
    });

    // send prompt to ollama
    ollama.stdin.write(prompt + "\n");
    ollama.stdin.end();
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
};
