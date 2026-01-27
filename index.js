const express = require('express');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Telegraf } = require('telegraf');
const qrcode = require('qrcode-terminal');
const app = express();
const port = process.env.PORT || 10000;

// Global variables for QR handling
let qrCodeData = null;
let adminChatId = null;

// 1. Cron-Job Server
app.get('/', (req, res) => res.send('Bot is Running!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

console.log("--------------------------------------");
console.log("🔥 STARTING OPERATION: FORCE START");

try {
  // STEP 1: Folder Check (100% Working)
  const homeDir = os.homedir();
  const botDir = path.join(homeDir, '.clawdbot');
  const sessionsDir = path.join(botDir, 'sessions');
  
  if (!fs.existsSync(botDir)) {
    fs.mkdirSync(botDir, { recursive: true });
    console.log(`✅ Created Directory: ${botDir}`);
  }
  
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
    console.log(`✅ Created Sessions Directory: ${sessionsDir}`);
  }

  // STEP 2: Create custom config files to bypass doctor
  console.log("📝 Creating custom config files...");
  
  // Create config.json
  const config = {
    "llm": {
      "provider": process.env.LLM_PROVIDER || "google",
      "google": {
        "apiKey": process.env.GOOGLE_API_KEY || ""
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
      "telegram": {
        "enabled": (process.env.ENABLED_PLATFORMS || "").includes("telegram")
      },
      "whatsapp": {
        "enabled": (process.env.ENABLED_PLATFORMS || "").includes("whatsapp")
      }
    },
    "stateDir": botDir,
    "version": "1.0.0"
  };
  
  fs.writeFileSync(
    path.join(botDir, 'config.json'),
    JSON.stringify(config, null, 2)
  );
  
  // Create platforms directory
  const platformsDir = path.join(botDir, 'platforms');
  if (!fs.existsSync(platformsDir)) {
    fs.mkdirSync(platformsDir, { recursive: true });
  }
  
  // Create telegram.json
  const telegramConfig = {
    "enabled": true,
    "botToken": process.env.TELEGRAM_BOT_TOKEN || "",
    "polling": {
      "enabled": true
    },
    "webhook": {
      "enabled": false
    }
  };
  
  fs.writeFileSync(
    path.join(platformsDir, 'telegram.json'),
    JSON.stringify(telegramConfig, null, 2)
  );
  
  // Create whatsapp.json with QR forwarding
  const whatsappConfig = {
    "enabled": true,
    "provider": "whatsapp-webjs",
    "whatsapp-webjs": {
      "authStrategy": "local",
      "session": {
        "strategy": "file",
        "path": path.join(sessionsDir, 'whatsapp-session.json')
      },
      "puppeteer": {
        "headless": true,
        "args": [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage"
        ]
      }
    }
  };
  
  fs.writeFileSync(
    path.join(platformsDir, 'whatsapp.json'),
    JSON.stringify(whatsappConfig, null, 2)
  );
  
  console.log("✅ Config files created successfully!");

  // STEP 3: Start Telegram Bot for QR Code
  console.log("🤖 Starting Telegram bot for QR codes...");
  
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    
    bot.command('start', (ctx) => {
      adminChatId = ctx.chat.id;
      ctx.reply('🤖 Clawdbot Admin Panel\n\nAvailable commands:\n/qr - Get WhatsApp QR code\n/status - Check bot status');
    });
    
    bot.command('qr', async (ctx) => {
      if (qrCodeData) {
        // Send QR as text
        await ctx.reply('📱 WhatsApp QR Code:');
        await ctx.reply(`\`\`\`\n${qrCodeData}\n\`\`\``, { parse_mode: 'Markdown' });
        await ctx.reply('Scan this QR code with WhatsApp > Linked Devices');
        
        // Also show in terminal format
        console.log("\n📱 QR Code for WhatsApp:");
        qrcode.generate(qrCodeData, { small: true });
      } else {
        await ctx.reply('No QR code available yet. Wait a moment and try again.');
      }
    });
    
    bot.command('status', (ctx) => {
      ctx.reply(`Bot Status: ${qrCodeData ? 'QR Ready' : 'Starting...'}\nAdmin: ${adminChatId ? 'Registered' : 'Not registered'}`);
    });
    
    bot.launch().then(() => {
      console.log('✅ Telegram bot started for QR codes');
    }).catch(err => {
      console.log('⚠️ Telegram bot failed:', err.message);
    });
    
    // Store bot instance
    global.telegramBot = bot;
  }

} catch (error) {
  console.log("⚠️ Setup error:", error.message);
}

console.log("--------------------------------------");
console.log("🚀 LAUNCHING CLAWDBOT GATEWAY...");

// STEP 4: Start Gateway with modified handler for QR codes
const botProcess = exec('npx clawdbot gateway --allow-unconfigured', {
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

// Capture QR code from clawdbot output
botProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Look for QR code in output
  if (output.includes('QR:')) {
    const match = output.match(/QR:\s*([^\s]+)/);
    if (match && match[1]) {
      qrCodeData = match[1];
      console.log(`\n🎯 QR Code Captured: ${qrCodeData.substring(0, 20)}...`);
      
      // Send to Telegram if admin is registered
      if (adminChatId && global.telegramBot) {
        global.telegramBot.telegram.sendMessage(
          adminChatId,
          '📱 *WhatsApp QR Code Ready!*\n\nSend /qr to get the QR code',
          { parse_mode: 'Markdown' }
        );
      }
      
      // Also show in console
      qrcode.generate(qrCodeData, { small: true });
    }
  }
  
  // Look for WhatsApp connected message
  if (output.includes('WhatsApp connected') || output.includes('READY')) {
    if (adminChatId && global.telegramBot) {
      global.telegramBot.telegram.sendMessage(
        adminChatId,
        '✅ WhatsApp connected successfully! You can now message the bot.'
      );
    }
  }
});

botProcess.stderr.on('data', (data) => {
  console.error(`ERROR: ${data}`);
});

// Handle process exit
botProcess.on('close', (code) => {
  console.log(`Bot process exited with code ${code}`);
  if (code !== 0) {
    console.log('Restarting in 5 seconds...');
    setTimeout(() => {
      console.log('🔁 Restarting bot...');
      // Auto-restart logic can go here
    }, 5000);
  }
});

// Keep alive
setInterval(() => {
  console.log('❤️ Heartbeat: Bot is alive');
}, 60000);
