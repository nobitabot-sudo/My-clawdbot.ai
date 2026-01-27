const express = require('express');
const { exec } = require('child_process');
const fs = require('fs'); // Ye naya tool hai jo file banayega
const app = express();
const port = process.env.PORT || 3000;

// 1. Cron-Job ke liye Server (Taaki bot soye nahi)
app.get('/', (req, res) => {
  res.send('Hybrid Bot (Tele+WA) is Running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// 2. AUTOMATIC CONFIG FILE CREATION (Magic Fix 🪄)
// Hum yahi par config file bana rahe hain taaki "Missing Config" error na aaye
console.log("Creating config file...");
const configContent = `
module.exports = {
  core: {
    llmProvider: 'google',
  },
  platforms: {
    telegram: {
      enabled: true, // Zabardasti ON kiya
    },
    whatsapp: {
      enabled: true, // Zabardasti ON kiya
    }
  }
};
`;

try {
  fs.writeFileSync('clawdbot.config.js', configContent);
  console.log("Config file created successfully! ✅");
} catch (err) {
  console.error("Error creating config file:", err);
}

// 3. Clawdbot Start Command
console.log("Starting Clawdbot Gateway...");

// Ab config file maujood hai, isliye bot turant start hoga
const bot = exec('npx clawdbot gateway --allow-unconfigured');

bot.stdout.on('data', (data) => {
  console.log(data); // Sab logs dikhao
});

bot.stderr.on('data', (data) => {
  // Ignore harmless warnings, show real errors
  console.error(`Log: ${data}`);
});
