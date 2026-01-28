const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== START WEB SERVER FIRST =====
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
  console.log(`🌐 Web URL: https://my-clawdbot-ai.onrender.com`);
});

// ===== BASIC ROUTES =====
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ClawdBot AI</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          margin: 0;
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
        .btn {
          display: inline-block;
          background: #0088cc;
          color: white;
          padding: 12px 30px;
          border-radius: 50px;
          text-decoration: none;
          font-weight: bold;
          margin: 10px;
          transition: transform 0.3s;
        }
        .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,136,204,0.3);
        }
        .steps {
          text-align: left;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .step {
          margin: 10px 0;
          padding-left: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 ClawdBot AI</h1>
        <div class="status">✅ ONLINE & RUNNING</div>
        
        <p>Your AI bot is live on Telegram!</p>
        
        <a href="https://t.me/Clawdbot2502_bot" class="btn" target="_blank">
          🚀 Open Telegram Bot
        </a>
        
        <div class="steps">
          <h3>How to use:</h3>
          <div class="step">1. Click the button above</div>
          <div class="step">2. Send <code>/start</code> to the bot</div>
          <div class="step">3. Send <code>/ai Hello</code></div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    telegram: 'active',
    server: 'Render',
    timestamp: new Date().toISOString()
  });
});

// ===== START TELEGRAM BOT =====
async function startTelegramBot() {
  try {
    const { Telegraf } = require('telegraf');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('⚠️ TELEGRAM_BOT_TOKEN not set');
      return;
    }
    
    console.log('🤖 Starting Telegram bot...');
    const bot = new Telegraf(token);
    
    // Initialize AI (FIXED SECTION)
    let aiModel = null;
    if (process.env.GOOGLE_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        
        // FIX: Using specific model version 'gemini-1.5-flash-001'
        // Also checks environment variable first
        const modelName = process.env.LLM_MODEL || "gemini-1.5-flash-001";
        console.log(`🔌 Connecting to AI Model: ${modelName}...`);
        
        aiModel = genAI.getGenerativeModel({ model: modelName });
        console.log('✅ Google AI initialized successfully');
        
      } catch (aiError) {
        console.log('❌ AI Init Error:', aiError.message);
        // Fallback attempt if flash fails
        try {
          console.log('⚠️ Attempting fallback to gemini-pro...');
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
          aiModel = genAI.getGenerativeModel({ model: "gemini-pro" });
          console.log('✅ Fallback AI Model initialized');
        } catch (fbError) {
          console.log('❌ Fallback failed too.');
        }
      }
    }
    
    // Commands
    bot.command('start', (ctx) => {
      ctx.replyWithMarkdown(`
🤖 *Welcome to ClawdBot!*

I'm your AI assistant powered by Google Gemini.

*Try these commands:*
/ai [question] - Ask me anything
/help - Show all commands
/status - Check bot status

*Or just send me any message!*
      `);
    });
    
    bot.command('ai', async (ctx) => {
      const question = ctx.message.text.replace('/ai', '').trim();
      
      if (!question) {
        return ctx.reply('Please ask a question. Example: /ai What is AI?');
      }
      
      if (!aiModel) {
        return ctx.reply('AI service is currently unavailable. Check logs.');
      }
      
      try {
        await ctx.replyWithChatAction('typing');
        const result = await aiModel.generateContent(question);
        const response = result.response.text();
        await ctx.reply(response, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('AI Gen Error:', error.message);
        if (error.message.includes('404')) {
           ctx.reply('❌ AI Model Error (404). Please restart the bot or check API Key.');
        } else {
           ctx.reply('❌ AI Error. Please try again.');
        }
      }
    });
    
    bot.command('help', (ctx) => {
      ctx.replyWithMarkdown(`
*🤖 Available Commands:*

/start - Start the bot
/ai [question] - Ask AI anything
/status - Check bot status
      `);
    });
    
    bot.command('status', (ctx) => {
      ctx.replyWithMarkdown(`
*📊 Bot Status:*

• Status: ✅ Online
• AI: ${aiModel ? 'Active ✅' : 'Disabled ❌'}
• Server: Render
• Uptime: ${process.uptime().toFixed(0)} seconds
      `);
    });
    
    bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      if (message.startsWith('/')) return;
      
      if (!aiModel) {
        return ctx.reply('AI service is offline. Try /ai command.');
      }
      
      try {
        await ctx.replyWithChatAction('typing');
        const result = await aiModel.generateContent(message);
        const response = result.response.text();
        await ctx.reply(response);
      } catch (error) {
        console.error('Error:', error.message);
        ctx.reply('Sorry, I faced an error processing that.');
      }
    });
    
    // Handle conflict gracefully
    bot.catch((err, ctx) => {
      if (err.message.includes('409')) {
        console.log('⚠️ Bot conflict - another instance might be running');
        return;
      }
      console.error('Bot error:', err);
    });
    
    // Launch bot
    await bot.launch();
    console.log('🎉 Telegram bot started successfully!');
    
  } catch (error) {
    if (error.message.includes('409')) {
      console.log('⚠️ Bot is already running elsewhere');
    } else {
      console.log('❌ Telegram bot error:', error.message);
    }
  }
}

// ===== MAIN STARTUP =====
console.log('🚀 Starting ClawdBot AI...');

// Start Telegram bot after a delay to ensure port is bound
setTimeout(() => {
  startTelegramBot().catch(console.error);
}, 3000);

console.log('✅ Web server started');
console.log('⏳ Telegram bot starting in 3 seconds...');

// Keep alive
setInterval(() => {
  console.log('❤️ Heartbeat:', new Date().toLocaleTimeString());
}, 60000);
