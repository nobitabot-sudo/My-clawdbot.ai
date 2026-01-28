const express = require('express');
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

// Initialize Google AI
let genAI = null;
let model = null;
let bot = null;
let botInfo = null;

// Store data
let userCount = 0;
const userSessions = new Map();

// ===== INITIALIZE AI =====
function initializeAI() {
  if (process.env.GOOGLE_API_KEY) {
    try {
      genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      model = genAI.getGenerativeModel({ model: "gemini-pro" });
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
    
    // Get bot info
    botInfo = await bot.telegram.getMe();
    console.log(`✅ Telegram Bot: @${botInfo.username}`);
    console.log(`✅ Bot ID: ${botInfo.id}`);
    console.log(`✅ Bot Name: ${botInfo.first_name}`);
    
    // ===== BOT COMMANDS =====
    
    // Start command
    bot.command('start', (ctx) => {
      userCount++;
      const userId = ctx.from.id;
      userSessions.set(userId, {
        name: ctx.from.first_name,
        chatHistory: []
      });
      
      ctx.replyWithMarkdown(`
🤖 *Welcome to ClawdBot!*

I'm now powered by Google Gemini AI! 🧠

*Available Commands:*
/help - Show all commands
/ai [message] - Chat with AI
/clear - Clear chat history
/about - About this bot
/status - Check bot status

*Just send me any message and I'll respond with AI!*

Example: "Hello, how are you?"
      `);
      
      console.log(`👤 New user: ${ctx.from.first_name} (${userId})`);
    });
    
    // AI Command
    bot.command('ai', async (ctx) => {
      const message = ctx.message.text.replace('/ai', '').trim();
      const userId = ctx.from.id;
      
      if (!message) {
        return ctx.reply('Send: /ai [your question]\nExample: /ai What is quantum computing?');
      }
      
      if (!model) {
        return ctx.reply('❌ AI service not available. Please check API key.');
      }
      
      try {
        // Send typing action
        await ctx.replyWithChatAction('typing');
        
        // Get AI response
        const result = await model.generateContent(message);
        const response = result.response.text();
        
        // Store in history
        if (!userSessions.has(userId)) {
          userSessions.set(userId, { chatHistory: [] });
        }
        userSessions.get(userId).chatHistory.push({ user: message, ai: response });
        
        // Limit history to last 10 messages
        if (userSessions.get(userId).chatHistory.length > 10) {
          userSessions.get(userId).chatHistory.shift();
        }
        
        // Send response
        await ctx.reply(`🤖 *AI Response:*\n\n${response}`, { parse_mode: 'Markdown' });
        
      } catch (error) {
        console.error('AI Error:', error);
        await ctx.reply('❌ Sorry, I encountered an error. Please try again.');
      }
    });
    
    // Clear command
    bot.command('clear', (ctx) => {
      const userId = ctx.from.id;
      if (userSessions.has(userId)) {
        userSessions.get(userId).chatHistory = [];
      }
      ctx.reply('✅ Chat history cleared!');
    });
    
    // Help command
    bot.command('help', (ctx) => {
      ctx.replyWithMarkdown(`
*🤖 AI Bot Help Menu*

*AI Commands:*
/ai [message] - Chat with Google Gemini AI
/clear - Clear your chat history

*Basic Commands:*
/start - Start the bot
/help - Show this help
/about - About this bot
/status - Bot status

*How to use:*
1. Use /ai followed by your question
2. Or just send any message (I'll respond with AI)
3. Use /clear to reset conversation

*Example:* /ai Explain quantum computing in simple terms
      `);
    });
    
    // About command
    bot.command('about', (ctx) => {
      ctx.replyWithMarkdown(`
*🤖 About ClawdBot*

*Version:* 2.0.0
*AI Model:* Google Gemini Pro
*Platform:* Telegram
*Host:* Render Free Tier
*Status:* Active ✅

*Features:*
• AI-powered responses
• Chat memory
• Free to use
• 24/7 availability

*Coming Soon:* WhatsApp integration
      `);
    });
    
    // Status command
    bot.command('status', (ctx) => {
      ctx.replyWithMarkdown(`
*📊 Bot Status*

• *Status:* ✅ **Online**
• *Users:* ${userCount}
• *AI Model:* ${model ? 'Google Gemini ✅' : 'Disabled ❌'}
• *Memory Usage:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• *Server:* Render
• *Uptime:* ${process.uptime().toFixed(0)} seconds
      `);
    });
    
    // Handle any text message with AI
    bot.on('text', async (ctx) => {
      const userMessage = ctx.message.text;
      const userId = ctx.from.id;
      
      // Skip if it's a command
      if (userMessage.startsWith('/')) return;
      
      console.log(`💬 ${ctx.from.first_name}: ${userMessage}`);
      
      if (!model) {
        return ctx.reply('AI service is currently unavailable. Please try /ai command.');
      }
      
      try {
        // Send typing indicator
        await ctx.replyWithChatAction('typing');
        
        // Get chat history
        let prompt = userMessage;
        if (userSessions.has(userId)) {
          const history = userSessions.get(userId).chatHistory;
          if (history.length > 0) {
            const context = history.slice(-3).map(h => `User: ${h.user}\nAI: ${h.ai}`).join('\n\n');
            prompt = `Context from previous conversation:\n${context}\n\nCurrent message: ${userMessage}`;
          }
        }
        
        // Get AI response
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        
        // Store in history
        if (!userSessions.has(userId)) {
          userSessions.set(userId, { 
            name: ctx.from.first_name,
            chatHistory: [] 
          });
        }
        userSessions.get(userId).chatHistory.push({ 
          user: userMessage, 
          ai: response 
        });
        
        // Limit history
        if (userSessions.get(userId).chatHistory.length > 10) {
          userSessions.get(userId).chatHistory.shift();
        }
        
        // Send response
        await ctx.reply(`🤖 ${response}`);
        
      } catch (error) {
        console.error('AI Error:', error);
        await ctx.reply('❌ Sorry, I had trouble processing that. Try /ai [your question]');
      }
    });
    
    // Error handling
    bot.catch((err, ctx) => {
      console.error(`Bot error:`, err);
      ctx.reply('❌ An error occurred. Please try again.');
    });
    
    // Launch bot
    await bot.launch();
    console.log('🎉 Telegram bot started successfully!');
    
    return true;
    
  } catch (error) {
    console.log('❌ Telegram bot failed to start:', error.message);
    return false;
  }
}

// ===== WEB SERVER =====
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Telegram Bot</title>
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
        .bot-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          text-align: left;
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
        <h1>🤖 AI Telegram Bot</h1>
        <div class="status">✅ ONLINE & RUNNING</div>
        
        <div class="bot-info">
          <h3>Bot Information:</h3>
          <p><strong>AI Model:</strong> Google Gemini Pro</p>
          <p><strong>Platform:</strong> Telegram</p>
          <p><strong>Users:</strong> ${userCount}</p>
          <p><strong>Status:</strong> Active ✅</p>
          ${botInfo ? `<p><strong>Username:</strong> @${botInfo.username}</p>` : ''}
        </div>
        
        ${botInfo ? `
          <a href="https://t.me/${botInfo.username}" class="telegram-btn" target="_blank">
            🚀 Open Telegram Bot
          </a>
        ` : ''}
        
        <div class="info">
          <p>Powered by Google Gemini AI</p>
          <p>Hosted on Render Free Tier</p>
          <p>Version 2.0.0</p>
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
    ai: model ? 'enabled' : 'disabled',
    users: userCount,
    server: 'Render',
    timestamp: new Date().toISOString()
  });
});

// ===== START EVERYTHING =====
async function startApp() {
  console.log('🚀 Starting AI Telegram Bot...');
  
  // Initialize AI
  const aiReady = initializeAI();
  
  // Start Telegram bot
  const botReady = await startTelegramBot();
  
  if (botReady) {
    console.log('🎉 Bot is ready!');
    console.log(`📱 Talk to your bot: https://t.me/${botInfo.username}`);
  } else {
    console.log('❌ Bot failed to start');
  }
  
  // Start web server
  app.listen(PORT, () => {
    console.log(`✅ Web server running on port ${PORT}`);
    console.log(`🌐 Web interface: https://your-render-app.onrender.com`);
  });
  
  // Keep alive
  setInterval(() => {
    console.log('❤️ Heartbeat:', new Date().toISOString());
  }, 60000);
}

// Handle shutdown
process.once('SIGINT', () => {
  if (bot) bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  if (bot) bot.stop('SIGTERM');
  process.exit(0);
});

// Start the app
startApp().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
