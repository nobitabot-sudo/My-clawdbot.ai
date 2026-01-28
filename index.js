const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== 1. SERVER (Bot Jaga Rahega) =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('🔥 Beast Bot is Live (Llama 3.3 + Images)'));

// ===== 2. MEMORY STORAGE =====
const chatHistory = new Map();

// ===== 3. AI ENGINE (Llama 3.3 - Super Fast & Smart) =====
async function getAIResponse(messages, apiKey) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://render.com",
        "X-Title": "BeastBot"
      },
      body: JSON.stringify({
        // Llama 3.3 70B (Ye abhi Free mein sabse Powerful aur Stable hai)
        model: "meta-llama/llama-3.3-70b-instruct:free", 
        messages: messages
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Bot abhi busy hai, dobara bolo.";
  } catch (error) {
    console.error("AI Error:", error);
    return "❌ Connection Error. Net check karo.";
  }
}

// ===== 4. TELEGRAM BOT =====
async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  if (!token || !orApiKey) return console.log("❌ Keys missing!");

  const bot = new Telegraf(token);

  // --- Pehchan (Identity) ---
  const systemMessage = {
    role: "system",
    content: "You are a highly intelligent, funny, and savage AI assistant. You answer quickly and smartly. You can also generate images."
  };

  // --- START ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply(
      '🔥 **Bot Online Hai!**\n\n' +
      'Main wapas aa gaya hu aur ab main **Fast** hu.\n' +
      '1. **Chat:** Kuch bhi pucho (No /ai needed).\n' +
      '2. **Image:** `/img` likh kar photo banvao.\n' +
      '3. **Reset:** `/reset` dabao agar nayi baat karni ho.'
    );
  });

  // --- IMAGE GENERATION (Viral Feature) ---
  bot.command('img', async (ctx) => {
    const prompt = ctx.message.text.replace('/img', '').trim();
    if (!prompt) return ctx.reply('🎨 Kya banau? Ex: `/img Cyberpunk city`');

    await ctx.replyWithChatAction('upload_photo');
    // High Quality Flux Model
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;

    try {
      await ctx.replyWithPhoto(imageUrl, { caption: `🎨 Created by AI` });
    } catch (e) {
      ctx.reply('❌ Photo error.');
    }
  });

  // --- RESET ---
  bot.command('reset', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('🧠 Memory Reset Done!');
  });

  // --- DIRECT CHAT ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    if (userText.startsWith('/')) return; // Ignore commands

    await ctx.replyWithChatAction('typing');

    // History Setup
    if (!chatHistory.has(ctx.chat.id)) {
      chatHistory.set(ctx.chat.id, [systemMessage]);
    }

    const history = chatHistory.get(ctx.chat.id);
    history.push({ role: "user", content: userText });

    // Keep last 20 messages
    if (history.length > 20) {
      const newHistory = [history[0], ...history.slice(history.length - 19)];
      chatHistory.set(ctx.chat.id, newHistory);
    }

    // AI Call
    const reply = await getAIResponse(chatHistory.get(ctx.chat.id), orApiKey);

    // Save & Send
    chatHistory.get(ctx.chat.id).push({ role: "assistant", content: reply });
    await ctx.reply(reply);
  });

  bot.launch();
  console.log("✅ Stable Bot Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
