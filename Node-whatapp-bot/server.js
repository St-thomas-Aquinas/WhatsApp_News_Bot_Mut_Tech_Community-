const express = require("express");
const wppconnect = require("@wppconnect-team/wppconnect");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

let client;

wppconnect.create({
  session: "news-session",
  catchQR: (base64Qr, asciiQR) => {
    console.log("Scan this QR to connect WhatsApp:");
    console.log(asciiQR);
  },
  statusFind: (statusSession, session) => {
    console.log("Status:", statusSession);
  }
})
.then((cl) => {
  client = cl;
  console.log("✅ WhatsApp client connected.");
})
.catch((error) => console.error("Error:", error));

app.post("/send", async (req, res) => {
  try {
    const { message, groupId } = req.body;
    if (!client) return res.status(500).json({ error: "Client not ready" });
    await client.sendText(groupId, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("✅ WhatsApp bot is running"));

app.listen(5000, () => console.log("Server running on port 5000"));
