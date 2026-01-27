const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Store QR code
let whatsappQrCode = null;
let telegramBot = null;
let whatsappClient = null;

// Basic server
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp + Telegram Bot</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { padding: 15px; border-radius: 10px; margin: 20px 0; }
        .online { background: #d4edda; color: #155724; }
        .offline { background: #f8d7da; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 WhatsApp + Telegram Bot</h1>
        <div class="status ${whatsappQrCode ? 'online' : 'offline'}">
          Status: ${whatsappQrCode ? 'QR Code Ready!' : 'Starting...'}
        </div>
        <p><strong>Steps to use:</strong></p>
        <ol style="text-align: left; display: inline-block;">
          <li>Open Telegram and message your bot with /start</li>
          <li>Send /qr to get WhatsApp QR code</li>
          <li>Open WhatsApp → Settings → Linked Devices</li>
          <li>Scan the QR code</li>
        </ol>
      </div>
    </body>
    </html>
  `);
});

// QR code endpoint (for manual access)
app.get('/qr', (req, res) => {
  if (whatsappQrCode) {
    res.send(`
      <h2>📱 WhatsApp QR Code</h2>
      <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px;">${whatsappQrCode}</pre>
      <p>Scan with WhatsApp → Linked Devices</p>
    `);
  } else {
    res.send('<h2>QR code not ready yet. Wait a moment...</h2>');
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    whatsapp: whatsappQrCode ? 'qr_ready' : 'starting',
    telegram: telegramBot ? 'online' : 'offline',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Web interface: https://your-render-app.onrender.com`);
  console.log(`📱 QR endpoint: https://your-render-app.onrender.com/qr`);
  startBots();
});

// Telegram Bot
async function startTelegramBot() {
  try {
    const { Telegraf } = require('telegraf');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('⚠️ TELEGRAM_BOT_TOKEN not set');
      return null;
    }
    
    console.log('🤖 Starting Telegram bot...');
    const bot = new Telegraf(token);
    
    bot.command('start', (ctx) => {
      ctx.reply(
        '🤖 *Bot Started!*\n\n' +
        'Commands:\n' +
        '/qr - Get WhatsApp QR code\n' +
        '/status - Check bot status\n' +
        '/help - Show help',
        { parse_mode: 'Markdown' }
      );
    });
    
    bot.command('qr', async (ctx) => {
      if (whatsappQrCode) {
        await ctx.reply('📱 *WhatsApp QR Code:*', { parse_mode: 'Markdown' });
        await ctx.reply(`\`\`\`\n${whatsappQrCode}\n\`\`\``, { parse_mode: 'Markdown' });
        await ctx.reply('1. Open WhatsApp\n2. Tap ⋮ → Linked Devices\n3. Tap "Link a Device"\n4. Scan QR');
      } else {
        await ctx.reply('QR code not ready yet. Try again in 30 seconds.');
      }
    });
    
    bot.command('status', (ctx) => {
      const status = whatsappQrCode ? '✅ QR Ready' : '⏳ Starting...';
      ctx.reply(`Status:\n• Telegram: ✅ Online\n• WhatsApp: ${status}`);
    });
    
    bot.command('help', (ctx) => {
      ctx.reply(
        'Available Commands:\n' +
        '/start - Start bot\n' +
        '/qr - Get WhatsApp QR\n' +
        '/status - Check status\n' +
        '/help - Show help'
      );
    });
    
    await bot.launch();
    console.log('✅ Telegram bot started!');
    
    const botInfo = await bot.telegram.getMe();
    console.log(`📱 Telegram Bot: @${botInfo.username}`);
    
    return bot;
    
  } catch (error) {
    console.log('❌ Telegram bot error:', error.message);
    return null;
  }
}

// WhatsApp Bot with FIX for Render
async function startWhatsAppBot() {
  try {
    const { Client, LocalAuth } = require('whatsapp-web.js');
    const qrcode = require('qrcode-terminal');
    
    console.log('📱 Setting up WhatsApp...');
    
    // SPECIAL SETUP FOR RENDER
    const puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process'
      ]
    };
    
    // Try to use puppeteer-core with chrome-aws-lambda for Render
    try {
      const chromium = require('chrome-aws-lambda');
      puppeteerOptions.executablePath = await chromium.executablePath;
      console.log('✅ Using chrome-aws-lambda Chromium');
    } catch (e) {
      console.log('⚠️ chrome-aws-lambda not available, using default');
    }
    
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: "render-whatsapp-bot"
      }),
      puppeteer: puppeteerOptions,
      webVersionCache: {
        type: "remote",
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html"
      }
    });
    
    client.on('qr', (qr) => {
      console.log('\n📱 ======== WHATSAPP QR CODE ========');
      qrcode.generate(qr, { small: true });
      console.log(`QR: ${qr}`);
      console.log('====================================\n');
      
      whatsappQrCode = qr;
      
      // Notify Telegram
      if (telegramBot) {
        telegramBot.telegram.sendMessage(
          process.env.ADMIN_CHAT_ID || 'any_chat_id',
          '📱 *WhatsApp QR Code Ready!*\nSend /qr to get it.',
          { parse_mode: 'Markdown' }
        ).catch(e => console.log('Telegram notify error:', e.message));
      }
    });
    
    client.on('ready', () => {
      console.log('✅ WhatsApp connected!');
      if (telegramBot) {
        telegramBot.telegram.sendMessage(
          process.env.ADMIN_CHAT_ID || 'any_chat_id',
          '✅ WhatsApp is now connected!',
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }
    });
    
    client.on('message', (msg) => {
      console.log(`📱 WhatsApp: ${msg.from}: ${msg.body}`);
    });
    
    client.on('auth_failure', (error) => {
      console.log('❌ WhatsApp auth failed:', error);
    });
    
    await client.initialize();
    return client;
    
  } catch (error) {
    console.log('❌ WhatsApp setup failed:', error.message);
    console.log('⚠️ Try alternative approach...');
    
    // Alternative: Wait for manual QR via web interface
    setTimeout(() => {
      whatsappQrCode = "MANUAL_SETUP_REQUIRED";
      console.log('⚠️ WhatsApp requires manual setup via web interface');
    }, 10000);
    
    return null;
  }
}

// Start both bots
async function startBots() {
  console.log('🚀 Starting both bots...');
  
  // Start Telegram first
  telegramBot = await startTelegramBot();
  
  // Then start WhatsApp
  whatsappClient = await startWhatsAppBot();
  
  console.log('🎉 Bot startup complete!');
  console.log('📱 Check Telegram for QR code or visit /qr endpoint');
}

// Keep alive ping
setInterval(() => {
  console.log('❤️ Bot heartbeat:', new Date().toISOString());
}, 300000); // Every 5 minutes
