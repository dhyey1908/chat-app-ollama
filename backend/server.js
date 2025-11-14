const express = require("express");
const cors = require("cors");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const { verifyToken } = require("./middleware/verifyToken");
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
  origin: "http://localhost:4200",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  next();
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Invalid JSON body:", err);
    return res.status(400).json({ error: "Invalid JSON format" });
  }
  next();
});

app.use("/api", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/chat", verifyToken, chatRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
