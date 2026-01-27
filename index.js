const express = require('express');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 10000;

// 1. Cron-Job Server
app.get('/', (req, res) => res.send('Bot is Alive!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

console.log("--------------------------------------");
console.log("🧹 SYSTEM CLEANUP & REPAIR");

try {
  // STEP 1: Purani kharab config file delete karo (Ye zaroori hai)
  if (fs.existsSync('clawdbot.config.js')) {
    fs.unlinkSync('clawdbot.config.js');
    console.log("🗑️ Deleted old config file (Trash cleared).");
  }

  // STEP 2: Doctor Fix chalao (Ye bot ka official repair tool hai)
  // Pichli baar error ki wajah se ye line chal hi nahi payi thi
  console.log("🚑 Running Doctor Auto-Fix...");
  execSync('npx clawdbot doctor --fix', { stdio: 'inherit' });
  console.log("✅ Doctor Fix Completed!");

} catch (error) {
  console.log("⚠️ Warning: Repair process incomplete, but proceeding...");
  console.log(error.message);
}

console.log("--------------------------------------");
console.log("🚀 STARTING CLAWDBOT GATEWAY...");

// STEP 3: Ab Start karo (Saaf suthre tareeke se)
const bot = exec('npx clawdbot gateway --allow-unconfigured');

bot.stdout.on('data', (data) => console.log(data));
bot.stderr.on('data', (data) => console.error(`Log: ${data}`));
