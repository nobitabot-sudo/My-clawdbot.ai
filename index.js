const express = require('express');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();
const port = process.env.PORT || 10000;

// 1. Cron-Job Server
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

console.log("--------------------------------------");
console.log("🛠️ INITIALIZING BOT SETUP...");

try {
  // STEP 1: Missing Folder Create Karo (CRITICAL FIX)
  // Render par 'home' directory me .clawdbot folder nahi hota, hum bana rahe hain
  const homeDir = os.homedir();
  const botDir = path.join(homeDir, '.clawdbot');
  
  if (!fs.existsSync(botDir)) {
    fs.mkdirSync(botDir, { recursive: true });
    console.log(`✅ Created missing directory: ${botDir}`);
  } else {
    console.log(`✅ Directory already exists: ${botDir}`);
  }

  // STEP 2: Gateway Mode Set Karo (Log requirement)
  console.log("⚙️ Setting Gateway Mode to Local...");
  execSync('npx clawdbot config set gateway.mode local', { stdio: 'inherit' });

  // STEP 3: Doctor Fix (Ab ye kaam karega kyunki folder ban chuka hai!)
  console.log("🚑 Running Doctor to Enable Platforms...");
  execSync('npx clawdbot doctor --fix', { stdio: 'inherit' });

} catch (error) {
  console.log("⚠️ Setup mein kuch issue aaya, par hum start karne ki koshish karenge...");
  console.log(error.message);
}

console.log("--------------------------------------");
console.log("🚀 STARTING CLAWDBOT...");

// STEP 4: Start Gateway
// '--allow-unconfigured' abhi bhi rakha hai safety ke liye
const bot = exec('npx clawdbot gateway --allow-unconfigured');

bot.stdout.on('data', (data) => console.log(data));
bot.stderr.on('data', (data) => console.error(`Log: ${data}`));
