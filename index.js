const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();
const port = process.env.PORT || 10000;

// 1. Cron-Job Server
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

console.log("--------------------------------------");
console.log("🛠️ FORCING CONFIGURATION...");

try {
  // STEP 1: Folder Banao (Jo pichli baar successful tha)
  const homeDir = os.homedir();
  const botDir = path.join(homeDir, '.clawdbot');
  
  if (!fs.existsSync(botDir)) {
    fs.mkdirSync(botDir, { recursive: true });
  }

  // STEP 2: Config File Seedha Write Karo (No Doctor needed)
  // Hum bot ke dimaag me seedha likh rahe hain ki "Enabled: True"
  const configData = {
    core: {
      llmProvider: "google"
    },
    gateway: {
      mode: "local"
    },
    platforms: {
      telegram: {
        enabled: true,
        // Token Environment Variable se uthayega
      },
      whatsapp: {
        enabled: true
      }
    }
  };

  // File save kar rahe hain location par: ~/.clawdbot/config.json
  const configFile = path.join(botDir, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));
  
  console.log(`✅ Config file forced at: ${configFile}`);
  console.log("✅ Telegram & WhatsApp set to ENABLED.");

} catch (error) {
  console.error("⚠️ Config Write Failed:", error);
}

console.log("--------------------------------------");
console.log("🚀 STARTING CLAWDBOT (NO INTERRUPTIONS)...");

// STEP 3: Ab Start karo (Ab Doctor ki zarurat nahi)
const bot = exec('npx clawdbot gateway --allow-unconfigured');

bot.stdout.on('data', (data) => console.log(data));
bot.stderr.on('data', (data) => console.error(`Log: ${data}`));
