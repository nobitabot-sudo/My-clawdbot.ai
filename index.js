const express = require('express');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const app = express();
const port = process.env.PORT || 10000;

// 1. Cron-Job Server
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

console.log("--------------------------------------");
console.log("🔥 STARTING OPERATION: FORCE START");

try {
  // STEP 1: Folder Check (100% Working)
  const homeDir = os.homedir();
  const botDir = path.join(homeDir, '.clawdbot');
  if (!fs.existsSync(botDir)) {
    fs.mkdirSync(botDir, { recursive: true });
    console.log(`✅ Created Directory: ${botDir}`);
  }

  // STEP 2: Mode Local Set (100% Working)
  try {
     execSync('npx clawdbot config set gateway.mode local', { stdio: 'inherit' });
  } catch (e) {}

  // STEP 3: THE BRAHMASTRA FIX 🪄
  // Hum 'yes' command use kar rahe hain jo infinite 'y' bhejega
  console.log("🚑 Running Doctor with Infinite YES...");
  
  // Ye line bot ko kabhi atakne nahi degi
  execSync('yes | npx clawdbot doctor --fix', { stdio: 'inherit', shell: true });
  
  console.log("✅ Doctor Fix Complete!");

} catch (error) {
  console.log("⚠️ Fix process me error, par hum aage badhenge...");
}

console.log("--------------------------------------");
console.log("🚀 LAUNCHING GATEWAY...");

// STEP 4: Start Gateway
const bot = exec('npx clawdbot gateway --allow-unconfigured');

bot.stdout.on('data', (data) => console.log(data));
bot.stderr.on('data', (data) => console.error(`Log: ${data}`));
