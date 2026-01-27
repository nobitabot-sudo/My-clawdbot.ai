const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// 1. Cron-Job ke liye Server (Taaki bot soye nahi)
app.get('/', (req, res) => {
  res.send('Hybrid Bot (Tele+WA) is Running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// 2. Clawdbot Start Command
// Hum environment variables se platform decide karenge
console.log("Starting Clawdbot...");

// Ye command bot ko start karegi aur logs me QR code dikhayegi
const bot = exec('npx clawdbot start --qrcode-terminal');

bot.stdout.on('data', (data) => {
  console.log(data); // Sab logs dikhao
});

bot.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});
