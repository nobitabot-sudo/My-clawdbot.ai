const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

// Simple web server
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

console.log("🚀 Starting Clawdbot Setup...");

// Step 1: Create config manually to avoid doctor
const botDir = path.join(os.homedir(), '.clawdbot');
const platformsDir = path.join(botDir, 'platforms');
const sessionsDir = path.join(botDir, 'sessions');

// Create directories
[botDir, platformsDir, sessionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});

// Step 2: Create minimal config.json
const config = {
  "llm": {
    "provider": "google",
    "google": {
      "apiKey": process.env.GOOGLE_API_KEY
    }
  },
  "gateway": {
    "mode": "local",
    "local": {
      "host": "0.0.0.0",
      "port": port
    }
  },
  "platforms": {
    "telegram": { "enabled": true },
    "whatsapp": { "enabled": true }
  },
  "stateDir": botDir
};

fs.writeFileSync(
  path.join(botDir, 'config.json'),
  JSON.stringify(config, null, 2)
);

// Step 3: Create telegram.json
const telegramConfig = {
  "enabled": true,
  "botToken": process.env.TELEGRAM_BOT_TOKEN,
  "polling": { "enabled": true },
  "webhook": { "enabled": false }
};

fs.writeFileSync(
  path.join(platformsDir, 'telegram.json'),
  JSON.stringify(telegramConfig, null, 2)
);

// Step 4: Create whatsapp.json WITHOUT Puppeteer for now
const whatsappConfig = {
  "enabled": true,
  "provider": "whatsapp-webjs",
  "whatsapp-webjs": {
    "authStrategy": "local",
    "session": {
      "strategy": "file",
      "path": path.join(sessionsDir, 'session.json')
    },
    "puppeteer": {
      "headless": true,
      "args": [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--single-process",
        "--no-zygote",
        "--disable-gpu",
        "--disable-dev-shm-usage"
      ]
    }
  }
};

fs.writeFileSync(
  path.join(platformsDir, 'whatsapp.json'),
  JSON.stringify(whatsappConfig, null, 2)
);

console.log("✅ Config files created successfully");

// Step 5: Set memory limit for Node.js
process.env.NODE_OPTIONS = '--max-old-space-size=384';

console.log("🤖 Starting Clawdbot Gateway...");

// Step 6: Start gateway WITHOUT doctor
const botProcess = exec('npx clawdbot gateway --allow-unconfigured', {
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=384',
    PUPPETEER_DISABLE_HEADLESS_WAYLAND: '1'
  }
});

// Capture and log output
botProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Check for QR code
  if (output.includes('QR code') || output.includes('QR:')) {
    console.log('\n🎯 QR CODE DETECTED!');
    console.log('📱 Open WhatsApp → Linked Devices → Scan QR');
  }
});

botProcess.stderr.on('data', (data) => {
  console.error(`ERROR: ${data}`);
});

botProcess.on('close', (code) => {
  console.log(`Bot exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting in 10 seconds...');
    setTimeout(() => process.exit(1), 10000);
  }
});
