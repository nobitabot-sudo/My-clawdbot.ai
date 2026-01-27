const express = require('express');
const { exec, execSync } = require('child_process'); // execSync naya hai
const app = express();
const port = process.env.PORT || 10000;

// 1. Cron-Job Server
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

console.log("--------------------------------------");
console.log("🤖 SYSTEM REPAIR STARTED");

try {
  // STEP 1: Zabardasti Settings ko 'TRUE' set karo
  console.log("👉 Forcing Telegram ON...");
  execSync('npx clawdbot config set platforms.telegram.enabled true', { stdio: 'inherit' });

  console.log("👉 Forcing WhatsApp ON...");
  execSync('npx clawdbot config set platforms.whatsapp.enabled true', { stdio: 'inherit' });

  // STEP 2: Doctor ko bolo khud hi sab fix kare (Log recommendation)
  console.log("👉 Running Doctor Fix...");
  execSync('npx clawdbot doctor --fix', { stdio: 'inherit' });

} catch (err) {
  console.log("⚠️ Choti moti warning aayi, par hum aage badhenge...");
}

console.log("--------------------------------------");
console.log("🚀 STARTING CLAWDBOT GATEWAY...");

// STEP 3: Ab Start karo
const bot = exec('npx clawdbot gateway');

bot.stdout.on('data', (data) => console.log(data));
bot.stderr.on('data', (data) => console.error(`Log: ${data}`));
