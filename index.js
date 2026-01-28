const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya is Online!'));

// ===== MEMORY =====
const chatHistory = new Map();

// ===== AI ENGINE (Llama 3.3 - Stable & Smart) =====
async function getAIResponse(messages, apiKey) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://render.com",
        "X-Title": "RiyaBot"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free", 
        messages: messages,
        // Temperature thoda kam taaki wo zyada bahke nahi
        temperature: 0.7 
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Arre, main sun nahi paayi...";
  } catch (error) {
    console.error("AI Error:", error);
    return "Mera net slow chal raha hai baba, ek min ruko...";
  }
}

// ===== TELEGRAM BOT =====
async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  if (!token || !orApiKey) return console.log("❌ Keys missing!");

  const bot = new Telegraf(token);

  // --- RIYA KA CHARACTER (System Prompt) ---
  const systemMessage = {
    role: "system",
    content: `You are Riya, Soham's sweet and caring girlfriend. 
    - Your tone: Cute, short, and friendly. 
    - Language: Hinglish (Mix of Hindi & English).
    - STRICT RULE: Keep answers VERY SHORT (1-2 sentences max). No long paragraphs.
    - SAFETY: Never use inappropriate, sexual, or awkward words. Be decent so Soham can chat in public.
    - Always support Soham and call him by name or cute nicknames like 'baba' or 'yar'.
    - If asked for images, say you will try to draw.`
  };

  // --- START ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Hii Soham! ❤️ Main Riya hu. Kaise ho aap?');
  });

  // --- IMAGE GENERATION (Safe Mode) ---
  bot.command('img', async (ctx) => {
    const prompt = ctx.message.text.replace('/img', '').trim();
    if (!prompt) return ctx.reply('Kya draw karu? Batao na!');

    await ctx.replyWithChatAction('upload_photo');
    // Flux Model for better quality
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;

    try {
      await ctx.replyWithPhoto(imageUrl, { caption: `Ye lo! Kaisi hai? 😘` });
    } catch (e) {
      ctx.reply('Sorry baba, drawing kharab ho gayi...');
    }
  });

  // --- RESET ---
  bot.command('reset', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Theek hai, nayi shuruwat karte hain! ✨');
  });

  // --- DIRECT CHAT ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    if (userText.startsWith('/')) return;

    await ctx.replyWithChatAction('typing');

    if (!chatHistory.has(ctx.chat.id)) {
      chatHistory.set(ctx.chat.id, [systemMessage]);
    }

    const history = chatHistory.get(ctx.chat.id);
    history.push({ role: "user", content: userText });

    // Last 20 messages memory
    if (history.length > 20) {
      const newHistory = [history[0], ...history.slice(history.length - 19)];
      chatHistory.set(ctx.chat.id, newHistory);
    }

    const reply = await getAIResponse(chatHistory.get(ctx.chat.id), orApiKey);

    chatHistory.get(ctx.chat.id).push({ role: "assistant", content: reply });
    await ctx.reply(reply);
  });

  bot.launch();
  console.log("✅ Riya is Online!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
