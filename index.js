const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== 1. WEB SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

app.get('/', (req, res) => res.send('Bot is Alive! 🤖'));

// ===== 2. SMART AI GENERATOR FUNCTION =====
// Ye function automatic model badal lega agar error aaya toh
async function generateSmartResponse(apiKey, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // List of models to try (Priority wise)
  // Sabse pehle '-001' wala specific version try karenge
  const modelsToTry = ["gemini-1.5-flash-001", "gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`🔄 Trying AI Model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      console.log(`✅ Success with model: ${modelName}`);
      return response; // Agar chal gaya toh yahi se return ho jao
      
    } catch (error) {
      console.log(`⚠️ Failed with ${modelName}: ${error.message}`);
      // Agar error aaya toh loop continue karega aur agla model try karega
    }
  }
  
  throw new Error("All models failed. Please check API Key.");
}

// ===== 3. TELEGRAM BOT =====
async function startTelegramBot() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!token || !apiKey) {
      console.log('⚠️ Error: TELEGRAM_BOT_TOKEN or GOOGLE_API_KEY missing.');
      return;
    }

    const bot = new Telegraf(token);
    console.log('🤖 Telegram Bot Initialized.');

    bot.command('start', (ctx) => {
      ctx.reply('Namaste! /ai likh kar kuch bhi pucho. Main jawab dunga.');
    });

    bot.command('ai', async (ctx) => {
      const text = ctx.message.text.replace('/ai', '').trim();
      
      if (!text) return ctx.reply('Sawla pucho bhai. Example: /ai Joke sunao');

      try {
        await ctx.replyWithChatAction('typing');
        
        // Hum purana tareeka nahi use karenge.
        // Hum naya "Smart Function" call karenge jo khud model dhundega.
        const response = await generateSmartResponse(apiKey, text);
        
        await ctx.reply(response);
        
      } catch (err) {
        console.error('Final Error:', err.message);
        ctx.reply('❌ Error: Google API Key issue or Quota exceeded.');
      }
    });

    await bot.launch();
    console.log('🚀 Telegram Bot Started Successfully!');

    // Graceful Stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (err) {
    console.error('Startup Error:', err);
  }
}

// ===== STARTUP =====
setTimeout(startTelegramBot, 3000);
