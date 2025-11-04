// node-whatsapp/server.js
import express from 'express';
import bodyParser from 'body-parser';
import wppconnect from '@wppconnect-team/wppconnect';
import path from 'path';

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 5000;

const SESSION_DIR = process.env.SESSION_DIR || './session';

// Create the wppconnect client with session directory
wppconnect.create({
  session: 'render-session',
  folderNameToken: SESSION_DIR,
  puppeteerOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
}).then(client => {
  console.log('✅ WhatsApp connected!');

  app.post('/send', async (req, res) => {
    const { message, groupId } = req.body;
    try {
      await client.sendText(groupId, message);
      return res.sendStatus(200);
    } catch (err) {
      console.error(err);
      return res.status(500).send({ error: err.message });
    }
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to launch WPPConnect:', err);
  process.exit(1);
});
