const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== 1. WEB SERVER (Bot ko zinda rakhne ke liye) =====
app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

app.get('/', (req, res) => res.send('🔥 Bot is Active! Running Llama 3.3 via OpenRouter.'));

// ===== 2. AI FUNCTION (Direct Connection - No Shell Needed) =====
async function getAIResponse(prompt, apiKey) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://render.com", // Optional for rankings
        "X-Title": "ClawdBot"
      },
      body: JSON.stringify({
        // Ye raha wo FREE aur POWERFUL Model
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    // Agar API se error aaye
    if (data.error) {
      console.error("OpenRouter API Error:", data.error);
      return `❌ Error: ${data.error.message}`;
    }

    // Sahi jawab return karo
    return data.choices[0]?.message?.content || "Hmm, AI ne kuch jawab nahi diya.";

  } catch (error) {
    console.error("Network Error:", error);
    return "❌ Error: Connection failed. Internet ya Key check karo.";
  }
}

// ===== 3. TELEGRAM BOT SETUP =====
async function startTelegramBot() {
  console.log("----------------------------------------");
  console.log("🚀 Starting Bot with OpenRouter Llama 3.3...");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  // Check karo ki dono keys hain ya nahi
  if (!token || !orApiKey) {
    console.log("❌ ERROR: Keys missing hain! Environment Variables check karo.");
    return;
  }

  try {
    const bot = new Telegraf(token);

    // --- Start Command ---
    bot.command('start', (ctx) => {
      ctx.reply(
        '🔥 *Hello! Main Llama 3.3 (70B) AI hu.*\n\n' +
        'Mujhse kuch bhi pucho, bas `/ai` laga kar.\n' +
        'Example: `/ai Taj Mahal kisne banaya?`',
        { parse_mode: 'Markdown' }
      );
    });

    // --- AI Command ---
    bot.command('ai', async (ctx) => {
      const userText = ctx.message.text.replace('/ai', '').trim();
      
      if (!userText) {
        return ctx.reply('Arre, kuch sawal toh pucho! Example: /ai Who is Batman?');
      }

      // Typing... dikhao taaki user ko lage kaam ho raha hai
      await ctx.replyWithChatAction('typing');

      // AI se jawab mango
      const reply = await getAIResponse(userText, orApiKey);
      
      // Jawab bhejo
      await ctx.reply(reply);
    });

    // Bot Launch
    await bot.launch();
    console.log("✅ Telegram Bot is Live! (Llama 3.3)");

    // Safety Stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (error) {
    console.log("❌ Startup Error:", error.message);
  }
}

// Start immediately
startTelegramBot();
