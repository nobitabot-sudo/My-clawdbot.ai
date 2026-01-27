const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// 1. Basic server for Render
app.get('/', (req, res) => {
  res.send('🤖 WhatsApp + Telegram Bot is Running!<br>Check logs for QR code.');
});

// 2. Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  startBots();
});

// 3. Start bots function
async function startBots() {
  console.log('🚀 Starting bots...');
  
  try {
    // Try to load WhatsApp bot
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcode = require('qrcode-terminal');
    
    console.log('🔧 Setting up WhatsApp...');
    
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
    
    whatsappClient.on('qr', (qr) => {
      console.log('\n📱 ======== WHATSAPP QR CODE ========');
      qrcode.generate(qr, { small: true });
      console.log(`QR String: ${qr}`);
      console.log('====================================\n');
      console.log('📱 Scan this QR with WhatsApp → Linked Devices');
    });
    
    whatsappClient.on('ready', () => {
      console.log('✅ WhatsApp connected!');
    });
    
    whatsappClient.on('message', (msg) => {
      console.log(`📱 Message from ${msg.from}: ${msg.body}`);
    });
    
    whatsappClient.initialize();
    
  } catch (error) {
    console.log('❌ WhatsApp setup failed:', error.message);
  }
  
  // Telegram bot
  try {
    const { Telegraf } = require('telegraf');
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (telegramToken) {
      console.log('🔧 Setting up Telegram...');
      const bot = new Telegraf(telegramToken);
      
      bot.command('start', (ctx) => {
        ctx.reply('🤖 Bot is running!\nCheck Render logs for WhatsApp QR code.');
      });
      
      bot.command('status', (ctx) => {
        ctx.reply('✅ Bot is online and running on Render');
      });
      
      bot.launch();
      console.log('✅ Telegram bot started');
    }
  } catch (error) {
    console.log('❌ Telegram setup failed:', error.message);
  }
  
  console.log('🎉 All bots initialized!');
}
