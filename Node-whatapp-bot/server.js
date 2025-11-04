import express from "express";
import bodyParser from "body-parser";
import wppconnect from "@wppconnect-team/wppconnect";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 5000;

// Temporary file to store QR code
let currentQr = null;

app.use(bodyParser.json());

// Serve the current QR image at /qr
app.get("/qr", (req, res) => {
  if (!currentQr) return res.send("❌ QR code not yet generated. Check logs.");
  const img = Buffer.from(currentQr.split(",")[1], "base64");
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": img.length,
  });
  res.end(img);
});

// Function to initialize WhatsApp session
async function startBot() {
  console.log("🚀 Starting WhatsApp bot...");

  const sessionOptions = {
    session: "tech-news-bot",
    catchQR: (base64Qr, asciiQR) => {
      console.log("\n🟢 WhatsApp session started — scan this QR below:\n");
      console.log(asciiQR);
      console.log(`\n🔗 Or open your hosted QR here: https://${
        process.env.RENDER_EXTERNAL_HOSTNAME || "localhost:" + PORT
      }/qr\n`);
      currentQr = base64Qr; // save for /qr route
    },
    statusFind: (statusSession, session) => {
      console.log(`📱 Status for ${session}: ${statusSession}`);
    },
    onLoadingScreen: (percent, message) => {
      console.log(`⏳ Loading ${percent}%: ${message}`);
    },
    autoClose: 0,
    headless: true,
    logQR: true,
    puppeteerOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    folderNameToken: "/data/",
    createPathFileToken: true,
    tokenStore: "file",
  };

  const client = await wppconnect.create(sessionOptions);

  client.onConnected(() => console.log("✅ WhatsApp client connected!"));
  client.onDisconnected(() => console.log("❌ WhatsApp disconnected."));

  // API to send messages to group
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

// Health check
app.get("/healthz", (req, res) => res.send("OK"));

// Start express
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startBot();
});
