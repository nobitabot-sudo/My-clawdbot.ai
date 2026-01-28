const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== WEB SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('Debugger Mode On 🕵️‍♂️'));

// ===== JASOOSI (DEBUGGING) STARTS HERE =====
async function debugSystem() {
  console.log("------------------------------------------------");
  console.log("🕵️‍♂️ SYSTEM DIAGNOSTIC STARTED");
  
  // 1. CHECK API KEY
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    console.log("❌ ERROR: API Key bilkul gayab hai! Environment Variables check karo.");
  } else {
    // Hum key ke shuru ke 5 akshar print karenge check karne ke liye
    // Darro mat, puri key logs me nahi aayegi, bas shuruwat ke 4-5 letters.
    console.log(`✅ API Key Detected! Starts with: ${key.substring(0, 5)}...`);
    console.log(`📏 Key Length: ${key.length} characters`);
  }

  // 2. CHECK AI MODEL (DIRECT TEST)
  console.log("🧪 Testing AI Connection directly (No Telegram)...");
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Pro is safest
    
    console.log("⏳ Sending test message to Google...");
    const result = await model.generateContent("Hello, are you working?");
    const response = result.response.text();
    
    console.log("🎉 AI TEST PASSED! Response received:");
    console.log(`>> "${response}"`);
    console.log("✅ Matlab API Key aur Google Connection 100% OK hai.");
    
  } catch (error) {
    console.log("❌ AI TEST FAILED!");
    console.log("Error Message:", error.message);
    if (error.message.includes("404")) console.log("👉 Matlab Model Name galat hai ya Key par access nahi hai.");
    if (error.message.includes("403") || error.message.includes("key")) console.log("👉 Matlab API Key GALAT hai.");
  }
  
  // 3. START TELEGRAM
  startTelegram();
}

async function startTelegram() {
  console.log("------------------------------------------------");
  console.log("🤖 Starting Telegram Bot...");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) { 
    console.log("❌ Telegram Token Missing!"); 
    return;
  }

  try {
    const bot = new Telegraf(token);
    
    // Simple Command
    bot.command('start', (ctx) => ctx.reply('Debugger Bot is Online! ✅'));
    
    bot.command('ai', async (ctx) => {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(ctx.message.text.replace('/ai', ''));
            ctx.reply(result.response.text());
        } catch(e) {
            ctx.reply(`Error: ${e.message}`);
        }
    });

    await bot.launch();
    console.log("✅ Telegram Bot Started Successfully!");
  } catch (e) {
    console.log("❌ Telegram Bot Crash:", e.message);
    if (e.message.includes("409")) console.log("👉 DO BOT CHAL RAHE HAIN! Purana wala band karo.");
  }
}

// Start Debugging immediately
setTimeout(debugSystem, 2000);
