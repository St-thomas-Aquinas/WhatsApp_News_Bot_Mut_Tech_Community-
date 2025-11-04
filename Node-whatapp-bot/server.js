import express from "express";
import bodyParser from "body-parser";
import wppconnect from "@wppconnect-team/wppconnect";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Store session in Render’s writable directory
const SESSION_PATH = "/data/session.json";

// Function to initialize WhatsApp session
async function startBot() {
  console.log("🚀 Starting WhatsApp bot...");

  const sessionOptions = {
    session: "tech-news-bot",
    catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
      console.log("\n🟢 WhatsApp session started — scan this QR below:\n");
      console.log(asciiQR);
      console.log("\n🔗 Or open this QR link in browser:\n");
      console.log(urlCode);
    },
    statusFind: (statusSession, session) => {
      console.log(`📱 Status for ${session}: ${statusSession}`);
    },
    onLoadingScreen: (percent, message) => {
      console.log(`⏳ Loading ${percent}%: ${message}`);
    },
    autoClose: 0, // Keep browser open
    headless: true,
    logQR: true,
    puppeteerOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    folderNameToken: "/data/",
    createPathFileToken: true,
    tokenStore: "file",
  };

  // Create client session
  const client = await wppconnect.create(sessionOptions);

  // Handle ready state
  client.onConnected(() => console.log("✅ WhatsApp client connected!"));
  client.onDisconnected(() => console.log("❌ WhatsApp disconnected."));

  // Expose send message route
  app.post("/send", async (req, res) => {
    const { message, groupId } = req.body;

    if (!message || !groupId) {
      return res.status(400).json({ error: "Missing message or groupId" });
    }

    try {
      await client.sendText(groupId + "@g.us", message);
      console.log(`📨 Message sent to group ${groupId}: ${message}`);
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      res.status(500).json({ error: error.message });
    }
  });
}

// Health check route for Render
app.get("/healthz", (req, res) => res.send("OK"));

// Start express server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startBot();
});
