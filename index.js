const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== 1. WEB SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

app.get('/', (req, res) => res.send('Bot is Alive & Kicking! 🤖'));

// ===== 2. SMART AI ENGINE =====
async function generateSmartResponse(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Hum ab NAYE aur PURANE dono models try karenge
  // "gemini-2.0-flash-exp" sabse naya hai, shayad wo chal jaye
  const modelsToTry = [
    "gemini-2.0-flash-exp",     // Newest Experimental
    "gemini-1.5-flash",         // Standard Fast
    "gemini-1.5-flash-latest",  // Latest Alias
    "gemini-pro",               // Old Reliable
    "gemini-1.0-pro"            // Legacy
  ];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`🔄 Trying AI Model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log(`✅ SUCCESS! Connected to: ${modelName}`);
      return response; 
      
    } catch (error) {
      console.log(`⚠️ Failed (${modelName}): 404 Not Found or Error.`);
    }
  }
  
  throw new Error("API Key Invalid or No Models Available.");
}

// ===== 3. TELEGRAM BOT =====
async function startTelegramBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!token || !apiKey) {
      console.log('⚠️ Critical Error: Token or API Key is missing!');
      return;
    }

    const bot = new Telegraf(token);
    console.log('🤖 Telegram Bot Initialized.');

    bot.command('start', (ctx) => {
      ctx.reply('Namaste! Main online hu. /ai likh kar kuch bhi pucho.');
    });

    bot.command('ai', async (ctx) => {
      const text = ctx.message.text.replace('/ai', '').trim();
      if (!text) return ctx.reply('Sawla pucho! Ex: /ai Hello');

      try {
        await ctx.replyWithChatAction('typing');
        const response = await generateSmartResponse(apiKey, text);
        await ctx.reply(response);
      } catch (err) {
        console.error('Final Failure:', err.message);
        ctx.reply('❌ Error: API Key galat hai ya naya Project banana padega Google AI Studio par.');
      }
    });

    await bot.launch();
    console.log('🚀 Telegram Bot Started!');

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (err) {
    console.log('Bot Crash:', err);
  }
}

// ===== STARTUP =====
setTimeout(startTelegramBot, 3000);
