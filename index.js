const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// Store data
let botInfo = null;
let userCount = 0;

// Basic HTML page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Telegram Bot - Live</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 500px;
          width: 100%;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
          font-size: 28px;
        }
        .status {
          background: #4CAF50;
          color: white;
          padding: 10px 20px;
          border-radius: 50px;
          display: inline-block;
          margin: 20px 0;
          font-weight: bold;
        }
        .steps {
          text-align: left;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .steps li {
          margin: 10px 0;
          padding-left: 10px;
        }
        .telegram-btn {
          display: inline-block;
          background: #0088cc;
          color: white;
          padding: 12px 30px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
          transition: transform 0.3s;
        }
        .telegram-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,136,204,0.3);
        }
        .info {
          margin-top: 20px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 Telegram Bot</h1>
        <div class="status">✅ ONLINE & RUNNING</div>
        
        <div class="steps">
          <h3>How to use:</h3>
          <ol>
            <li>Open Telegram on your phone</li>
            <li>Search for: <strong>${botInfo ? '@' + botInfo.username : 'YourBotName'}</strong></li>
            <li>Send <code>/start</code> to begin</li>
            <li>Send <code>/help</code> for commands</li>
          </ol>
        </div>
        
        ${botInfo ? `
          <a href="https://t.me/${botInfo.username}" class="telegram-btn" target="_blank">
            Open Telegram Bot
          </a>
        ` : ''}
        
        <div class="info">
          <p>Users connected: ${userCount}</p>
          <p>Server: Render Free Tier</p>
          <p>Status: Active ✅</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    telegram: botInfo ? `@${botInfo.username}` : 'starting',
    users: userCount,
    server: 'Render',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Web URL: https://your-render-app.onrender.com`);
  startTelegramBot();
});

// Telegram Bot Function
async function startTelegramBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('❌ TELEGRAM_BOT_TOKEN not set in environment variables');
      console.log('ℹ️ Please add it in Render Dashboard → Environment');
      return;
    }
    
    console.log('🤖 Starting Telegram bot...');
    
    // Create bot instance
    const bot = new Telegraf(token);
    
    // Get bot info
    botInfo = await bot.telegram.getMe();
    console.log(`✅ Telegram Bot: @${botInfo.username}`);
    console.log(`✅ Bot ID: ${botInfo.id}`);
    console.log(`✅ Bot Name: ${botInfo.first_name}`);
    
    // ===== BOT COMMANDS =====
    
    // Start command
    bot.command('start', (ctx) => {
      userCount++;
      ctx.replyWithMarkdown(`
🤖 *Welcome to ClawdBot!*

I'm your AI assistant running on Render.

*Available Commands:*
/help - Show all commands
/test - Test if bot is working
/chat - Start a conversation
/about - About this bot
/status - Check bot status

*Quick Start:*
1. Just send me any message
2. I'll respond with AI assistance
3. Type /help anytime for commands

Developed with ❤️ for Telegram + WhatsApp integration.
      `);
      
      console.log(`👤 New user: ${ctx.from.first_name} (${ctx.from.id})`);
    });
    
    // Help command
    bot.command('help', (ctx) => {
      ctx.replyWithMarkdown(`
*📚 Help Menu*

*Basic Commands:*
/start - Start the bot
/help - Show this help
/test - Test bot response
/about - About this bot
/status - Bot status

*AI Commands:*
/chat [message] - Chat with AI
/ask [question] - Ask anything

*Admin Commands:*
/users - Show user count
/stats - Show bot statistics

*Need more help?*
Just send me any message and I'll respond!
      `);
    });
    
    // Test command
    bot.command('test', (ctx) => {
      ctx.reply('✅ Bot is working perfectly!');
      ctx.reply(`Server: Render\nTime: ${new Date().toLocaleString()}\nStatus: ✅ Online`);
    });
    
    // About command
    bot.command('about', (ctx) => {
      ctx.replyWithMarkdown(`
*🤖 About ClawdBot*

*Version:* 1.0.0
*Platform:* Telegram + WhatsApp
*Host:* Render Free Tier
*Status:* Active ✅

*Features:*
• AI-powered responses
• Multi-platform support
• 24/7 availability
• Free to use

*Developer:* AI Assistant Project
*Goal:* Provide free AI access to everyone
      `);
    });
    
    // Status command
    bot.command('status', (ctx) => {
      ctx.replyWithMarkdown(`
*📊 Bot Status*

• *Status:* ✅ **Online**
• *Users:* ${userCount}
• *Uptime:* ${process.uptime().toFixed(0)} seconds
• *Memory:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• *Platform:* Telegram
• *Server:* Render
• *Next Feature:* WhatsApp Integration
      `);
    });
    
    // Chat command
    bot.command('chat', (ctx) => {
      const message = ctx.message.text.replace('/chat', '').trim();
      if (message) {
        ctx.reply(`You said: "${message}"\n\n(Coming soon: AI response integration!)`);
      } else {
        ctx.reply('Send: /chat [your message]\nExample: /chat Hello, how are you?');
      }
    });
    
    // Users command
    bot.command('users', (ctx) => {
      ctx.reply(`Total users: ${userCount}\n\nThank you for using the bot! 🙏`);
    });
    
    // Handle any text message
    bot.on('text', (ctx) => {
      const userMessage = ctx.message.text;
      
      // Don't process commands
      if (userMessage.startsWith('/')) return;
      
      console.log(`💬 Message from ${ctx.from.first_name}: ${userMessage}`);
      
      // Simple echo response (replace with AI later)
      ctx.replyWithMarkdown(`
*You said:* ${userMessage}

*My response:* I received your message! Currently I'm in basic mode. AI integration will be added soon!

Try these commands:
• /help - Show all commands
• /chat - Start AI conversation
• /status - Check bot status

*Coming soon:* Claude AI integration! 🚀
      `);
    });
    
    // Error handling
    bot.catch((err, ctx) => {
      console.error(`Bot error:`, err);
      ctx.reply('❌ An error occurred. Please try again.');
    });
    
    // Launch bot
    await bot.launch();
    console.log('🎉 Telegram bot started successfully!');
    
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
  } catch (error) {
    console.log('❌ Telegram bot failed to start:', error.message);
    console.log('⚠️ Common issues:');
    console.log('1. Invalid Telegram bot token');
    console.log('2. Token not set in environment variables');
    console.log('3. Network issues on Render');
    
    // Try fallback
    setTimeout(() => {
      console.log('🔄 Attempting to restart bot...');
      startTelegramBot();
    }, 10000);
  }
}

// Keep alive
setInterval(() => {
  console.log('❤️ Heartbeat: Bot is alive at', new Date().toISOString());
}, 60000);
