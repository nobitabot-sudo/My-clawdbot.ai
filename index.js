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
console.log("🔥 STARTING FINAL FIX PROTOCOL...");

try {
  // STEP 1: Folder Banao (Ye zaroori hai)
  const homeDir = os.homedir();
  const botDir = path.join(homeDir, '.clawdbot');
  
  if (!fs.existsSync(botDir)) {
    fs.mkdirSync(botDir, { recursive: true });
    console.log(`✅ Created directory: ${botDir}`);
  }

  // STEP 2: Gateway Mode Local Set Karo
  try {
     execSync('npx clawdbot config set gateway.mode local', { stdio: 'inherit' });
  } catch (e) { console.log("Mode set warning (ignorable)."); }

  // STEP 3: THE MAGIC FIX 🪄
  // Hum 'yes' command pipe kar rahe hain taaki bot 'Wait' na kare
  console.log("🚑 Forcing Doctor Fix with Auto-Yes...");
  // 'echo y' ka matlab hai: Jab bhi sawal pucho, jawab 'y' hai.
  execSync('echo "y" | npx clawdbot doctor --fix', { stdio: 'inherit', shell: true });
  console.log("✅ Doctor Fix Applied Successfully!");

} catch (error) {
  console.log("⚠️ Fix process me error aaya, par hum rukenge nahi...");
  console.log(error.message);
}

console.log("--------------------------------------");
console.log("🚀 STARTING CLAWDBOT GATEWAY...");

// STEP 4: Start Gateway
const bot = exec('npx clawdbot gateway --allow-unconfigured');

bot.stdout.on('data', (data) => console.log(data));
bot.stderr.on('data', (data) => console.error(`Log: ${data}`));
