const express = require("express");
const cors = require("cors");
const chatRoutes = require("./routes/chatRoutes");
const authRoutes = require("./routes/authRoutes")
const contactRoutes = require("./routes/contactRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", chatRoutes);
app.use("/api", authRoutes);
app.use("/api/contact", contactRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
