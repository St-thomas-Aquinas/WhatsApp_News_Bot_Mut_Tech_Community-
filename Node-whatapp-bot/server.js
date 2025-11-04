import express from "express";
import { create, Whatsapp } from "wppconnect";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

const SESSION_PATH = "/data/session"; // Render persistent disk (if configured)
const SESSION_FILE = path.join(SESSION_PATH, "session.json");

// Create folder if missing
if (!fs.existsSync(SESSION_PATH)) {
  fs.mkdirSync(SESSION_PATH, { recursive: true });
}

let client;

// Function to initialize WhatsApp client
async function initWhatsApp() {
  console.log("🚀 Starting WhatsApp session...");

  client = await create({
    session: "news-session",
    headless: true,
    deviceName: "RenderBot",
    catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
      console.log("🟢 WhatsApp session started — scan this QR:\n");
      console.log(asciiQR);
      console.log("\n🔗 Open this link to view QR as an image:\n");
      console.log(urlCode); // clickable QR URL
    },
    statusFind: (statusSession, session) => {
      console.log("📱 Status:", statusSession);
    },
    onLoadingScreen: (percent, message) => {
      console.log("⏳ Loading:", percent, message);
    },
    browserArgs: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
    ],
  });

  // Save session when available
  client.onStateChange((state) => {
    console.log("🔄 State changed:", state);
    if (state === "CONNECTED" || state === "LOGGED") {
      fs.writeFileSync(SESSION_FILE, JSON.stringify({ session: "news-session" }));
    }
  });
}

// Initialize the client
initWhatsApp().catch((err) => console.error("❌ Error initializing WhatsApp:", err));

// 📨 Endpoint to send message
app.post("/send", async (req, res) => {
  try {
    const { message, groupId } = req.body;

    if (!message || !groupId) {
      return res.status(400).json({ error: "Missing message or groupId" });
    }

    if (!client) {
      return res.status(500).json({ error: "WhatsApp client not ready yet." });
    }

    await client.sendText(groupId, message);
    res.json({ success: true, sent: message });
  } catch (err) {
    console.error("❌ Send error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
