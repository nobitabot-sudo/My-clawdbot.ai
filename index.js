const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// 1. Basic web server for Render
app.get('/', (req, res) => {
  res.send('🤖 WhatsApp + Telegram Bot is Running!');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

console.log('🚀 Starting WhatsApp + Telegram Bot...');

// 2. Telegram Bot Setup
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
let adminChatId = null;
let whatsappQrCode = null;

if (!telegramToken) {
  console.log('⚠️ Telegram token not found. Using console only.');
} else {
  try {
    const telegramBot = new Telegraf(telegramToken);
    
    telegramBot.command('start', (ctx) => {
      adminChatId = ctx.chat.id;
      ctx.reply('🤖 Welcome to Clawdbot!\n\nCommands:\n/qr - Get WhatsApp QR code\n/status - Check bot status');
    });
    
    telegramBot.command('qr', (ctx) => {
      if (whatsappQrCode) {
        ctx.reply('📱 Scan this QR with WhatsApp → Linked Devices:');
        ctx.reply(`\`${whatsappQrCode}\``, { parse_mode: 'Markdown' });
      } else {
        ctx.reply('QR code not ready yet. Wait a moment...');
      }
    });
    
    telegramBot.command('status', (ctx) => {
      ctx.reply('✅ Bot is online!\nSend /qr to get WhatsApp QR code');
    });
    
    telegramBot.launch();
    console.log('✅ Telegram bot started');
  } catch (error) {
    console.log('❌ Telegram bot error:', error.message);
  }
}

// 3. WhatsApp Bot Setup
console.log('🔧 Setting up WhatsApp client...');

const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    clientId: "render-bot"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process'
    ]
  }
});

// QR Code Handler
whatsappClient.on('qr', (qr) => {
  console.log('\n📱 ======== WHATSAPP QR CODE ========');
  qrcode.generate(qr, { small: true });
  console.log(`QR String: ${qr}`);
  console.log('====================================\n');
  
  whatsappQrCode = qr;
  
  // Send to Telegram if available
  if (adminChatId) {
    const telegramBot = new Telegraf(telegramToken);
    telegramBot.telegram.sendMessage(adminChatId, '📱 *WhatsApp QR Code Ready!*\n\nSend /qr to see it', {
      parse_mode: 'Markdown'
    });
  }
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  if (adminChatId) {
    const telegramBot = new Telegraf(telegramToken);
    telegramBot.telegram.sendMessage(adminChatId, '✅ WhatsApp connected successfully!');
  }
});

whatsappClient.on('message', (message) => {
  console.log(`📱 WhatsApp message from ${message.from}: ${message.body}`);
});

whatsappClient.on('disconnected', (reason) => {
  console.log('❌ WhatsApp disconnected:', reason);
});

// Start WhatsApp
whatsappClient.initialize();

console.log('🎉 Bot setup complete!');
console.log('1. Open Telegram and send /start to your bot');
console.log('2. Then send /qr to get WhatsApp QR code');
console.log('3. Scan QR with WhatsApp → Linked Devices');
