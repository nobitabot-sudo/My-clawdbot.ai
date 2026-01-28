const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Telegraf } = require('telegraf'); // Telegraf upar hi import kar liya safe side ke liye

const app = express();
const PORT = process.env.PORT || 10000;

// ===== 1. WEB SERVER (Keep Alive) =====
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
  console.log(`🌐 Web URL: https://my-clawdbot-ai.onrender.com`);
});

app.get('/', (req, res) => {
  res.send('Bot is Alive! 🤖 (Telegram & AI Running)');
});

app.get('/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// ===== 2. TELEGRAM BOT SETUP =====
async function startTelegramBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('⚠️ Error: TELEGRAM_BOT_TOKEN missing inside Environment Variables.');
      return;
    }
    
    console.log('🤖 Initializing Telegram Bot...');
    const bot = new Telegraf(token);
    
    // ===== 3. AI SETUP (With Auto-Fix Logic) =====
    let aiModel = null;
    
    if (process.env.GOOGLE_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        
        // TRY 1: New Fast Model (Flash)
        // Hum hardcode kar rahe hain taaki Env variable ki galti na ho
        const primaryModel = "gemini-1.5-flash"; 
        console.log(`🔌 Connecting to Primary Model: ${primaryModel}...`);
        
        aiModel = genAI.getGenerativeModel({ model: primaryModel });
        console.log('✅ Google AI Connected (Flash Model)');
        
      } catch (error) {
        console.log('⚠️ Primary Model Failed, trying Backup...');
      }
    } else {
      console.log('⚠️ GOOGLE_API_KEY nahi mili!');
    }

    // ===== COMMANDS =====
    bot.command('start', (ctx) => {
      ctx.replyWithMarkdown(`
👋 *Hello! I am ClawdBot.*

I am powered by Google Gemini AI.
Ask me anything using the /ai command.

*Example:*
\`/ai What is the capital of India?\`
      `);
    });
    
    bot.command('ai', async (ctx) => {
      const question = ctx.message.text.replace('/ai', '').trim();
      
      if (!question) {
        return ctx.reply('Kuch sawal toh pucho! (Eg: /ai Tell me a joke)');
      }
      
      // Check if AI is ready
      if (!process.env.GOOGLE_API_KEY) {
        return ctx.reply('❌ API Key missing inside Render Settings.');
      }

      try {
        await ctx.replyWithChatAction('typing');

        // Logic: Agar AI Model set hai toh use karo, warna On-the-fly initialize karo
        // Ye "Backup Logic" hai agar upar wala fail hua ho
        if (!aiModel) {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            // Fallback to 'gemini-pro' because it never fails on old keys
            aiModel = genAI.getGenerativeModel({ model: "gemini-pro" }); 
        }

        const result = await aiModel.generateContent(question);
        const response = result.response.text();
        
        // Telegram par bhejo
        await ctx.reply(response, { parse_mode: 'Markdown' });

      } catch (error) {
        console.error('AI Error:', error.message);
        
        if (error.message.includes('404')) {
           // Agar abhi bhi 404 aa raha hai, iska matlab API Key hi galat hai
           ctx.reply('❌ Error 404: Google API Key valid nahi hai ya Model access nahi hai. Please new API Key generate karein.');
        } else {
           ctx.reply('❌ Error: Main abhi jawab nahi de pa raha hu. Thodi der baad try karein.');
        }
      }
    });
    
    // Launch Bot
    bot.launch();
    console.log('🚀 Telegram Bot Started Successfully!');
    
    // Graceful Stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (error) {
    console.log('❌ Bot Crash Error:', error.message);
  }
}

// ===== STARTUP SEQUENCE =====
console.log('⏳ Starting Bot System...');
setTimeout(startTelegramBot, 3000); // 3 second wait taaki port bind ho jaye
