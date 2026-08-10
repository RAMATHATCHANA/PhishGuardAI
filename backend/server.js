const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Test API
app.get("/api/message", (req, res) => {
    res.json({ text: "Backend is working 🚀" });
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});