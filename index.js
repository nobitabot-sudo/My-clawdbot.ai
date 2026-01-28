const express = require('express');
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

// Initialize
let genAI = null;
let model = null;
let bot = null;
let botInfo = null;
let userCount = 0;
const userSessions = new Map();

// ===== INITIALIZE AI =====
function initializeAI() {
  if (process.env.GOOGLE_API_KEY) {
    try {
      genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log('✅ Google AI initialized');
      return true;
    } catch (error) {
      console.log('❌ Google AI init error:', error.message);
      return false;
    }
  } else {
    console.log('⚠️ GOOGLE_API_KEY not set');
    return false;
  }
}

// ===== TELEGRAM BOT =====
async function startTelegramBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('❌ TELEGRAM_BOT_TOKEN not set');
      return false;
    }
    
    console.log('🤖 Starting Telegram bot...');
    bot = new Telegraf(token);
    
    // ===== BOT COMMANDS =====
    
    bot.command('start', (ctx) => {
      userCount++;
      const userId = ctx.from.id;
      userSessions.set(userId, {
        name: ctx.from.first_name,
        chatHistory: []
      });
      
      ctx.replyWithMarkdown(`
🤖 *Welcome to ClawdBot!*

I'm powered by Google Gemini AI! 🧠

*Try these commands:*
/ai [question] - Ask AI anything
/help - Show all commands
/status - Check bot status

*Or just send me any message!*

Example: "Hello, what can you do?"
      `);
      
      console.log(`👤 New user: ${ctx.from.first_name} (${userId})`);
    });
    
    bot.command('ai', async (ctx) => {
      const message = ctx.message.text.replace('/ai', '').trim();
      
      if (!message) {
        return ctx.reply('Send: /ai [your question]\nExample: /ai What is AI?');
      }
      
      if (!model) {
        return ctx.reply('❌ AI service not available.');
      }
      
      try {
        await ctx.replyWithChatAction('typing');
        const result = await model.generateContent(message);
        const response = result.response.text();
        await ctx.reply(`🤖 *AI Response:*\n\n${response}`, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('AI Error:', error);
        await ctx.reply('❌ Error. Please try again.');
      }
    });
    
    bot.command('help', (ctx) => {
      ctx.replyWithMarkdown(`
*🤖 Bot Commands:*

/start - Start the bot
/ai [question] - Ask AI anything
/status - Check bot status
/help - Show this message

*How to use:*
1. Send /ai followed by your question
2. Or just send any message
3. I'll respond with AI!

*Example:* /ai Explain quantum computing
      `);
    });
    
    bot.command('status', (ctx) => {
      ctx.replyWithMarkdown(`
*📊 Bot Status:*

• *Status:* ✅ **Live on Render**
• *Users:* ${userCount}
• *AI Model:* Google Gemini ✅
• *Server:* Render Free Tier
• *Uptime:* ${process.uptime().toFixed(0)}s
• *URL:* https://my-clawdbot-ai.onrender.com
      `);
    });
    
    bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      if (message.startsWith('/')) return;
      
      if (!model) {
        return ctx.reply('AI service is offline. Try /ai command.');
      }
      
      try {
        await ctx.replyWithChatAction('typing');
        const result = await model.generateContent(message);
        const response = result.response.text();
        await ctx.reply(`🤖 ${response}`);
      } catch (error) {
        console.error('Error:', error);
        ctx.reply('Try: /ai [your question]');
      }
    });
    
    // GET BOT INFO
    try {
      botInfo = await bot.telegram.getMe();
      console.log(`✅ Telegram Bot: @${botInfo.username}`);
      console.log(`✅ Bot Name: ${botInfo.first_name}`);
    } catch (error) {
      console.log('⚠️ Could not get bot info:', error.message);
    }
    
    // START BOT WITH RETRY LOGIC
    let retries = 3;
    while (retries > 0) {
      try {
        await bot.launch();
        console.log('🎉 Telegram bot started successfully!');
        break;
      } catch (error) {
        if (error.message.includes('409') && retries > 1) {
          console.log(`⚠️ Conflict detected. Retrying in 5 seconds... (${retries-1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          retries--;
        } else {
          throw error;
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Telegram bot error:', error.message);
    console.log('⚠️ Bot might already be running elsewhere.');
    console.log('ℹ️ Your bot is accessible at: https://t.me/Clawdbot2502_bot');
    return false;
  }
}

// ===== WEB SERVER =====
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>AI Telegram Bot</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
      .container { max-width: 600px; margin: 0 auto; }
      .btn { display: inline-block; background: #0088cc; color: white; 
             padding: 15px 30px; border-radius: 50px; text-decoration: none; 
             margin: 20px; font-weight: bold; }
      .status { background: #4CAF50; color: white; padding: 10px; border-radius: 10px; }
    </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AI Telegram Bot</h1>
        <div class="status">✅ ONLINE & RUNNING</div>
        <p>Your bot is live on Telegram!</p>
        
        <a href="https://t.me/Clawdbot2502_bot" class="btn" target="_blank">
          🚀 Open Telegram Bot
        </a>
        
        <p><strong>Bot Commands:</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>/start - Start the bot</li>
          <li>/ai [question] - Ask AI anything</li>
          <li>/status - Check bot status</li>
          <li>/help - Show all commands</li>
        </ul>
        
        <p><strong>How to use:</strong></p>
        <ol style="text-align: left; display: inline-block;">
          <li>Click the button above</li>
          <li>Send /start to the bot</li>
          <li>Send /ai What is artificial intelligence?</li>
          <li>Or just send any message!</li>
        </ol>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    telegram: botInfo ? `@${botInfo.username}` : 'Clawdbot2502_bot',
    ai: model ? 'enabled' : 'disabled',
    server: 'Render',
    url: 'https://my-clawdbot-ai.onrender.com'
  });
});

// ===== START APP =====
async function startApp() {
  console.log('🚀 Starting AI Telegram Bot...');
  
  // Initialize AI
  initializeAI();
  
  // Start Telegram bot
  await startTelegramBot();
  
  // Start web server
  app.listen(PORT, () => {
    console.log(`✅ Web server: https://my-clawdbot-ai.onrender.com`);
    console.log(`📱 Telegram: https://t.me/Clawdbot2502_bot`);
    console.log('🎉 Bot is ready!');
  });
  
  // Keep alive
  setInterval(() => {
    console.log('❤️ Heartbeat:', new Date().toLocaleTimeString());
  }, 60000);
}

// Start
startApp().catch(console.error);
