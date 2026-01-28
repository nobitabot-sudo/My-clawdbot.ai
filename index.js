const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== 1. SERVER KEEP-ALIVE =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('🚀 Bot is Live: DeepSeek-R1 + Images'));

// ===== 2. MEMORY STORAGE =====
const chatHistory = new Map();

// ===== 3. AI ENGINE (DeepSeek-R1 via OpenRouter) =====
async function getAIResponse(messages, apiKey) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://render.com",
        "X-Title": "ClawdBot"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free", // Viral "Thinking" Model
        messages: messages
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Bot soch mein pad gaya...";
  } catch (error) {
    console.error("AI Error:", error);
    return "❌ Error: Server busy hai. Thodi der baad try karo.";
  }
}

// ===== 4. TELEGRAM BOT LOGIC =====
async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  if (!token || !orApiKey) return console.log("❌ Keys missing! Check Environment.");

  const bot = new Telegraf(token);

  // --- Bot ki Pehchan (Identity) ---
  const systemMessage = {
    role: "system",
    content: "You are a super-intelligent AI assistant. You are helpful, witty, and smart. You can generate images when asked. Keep answers concise."
  };

  // --- START Command ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply(
      '🚀 **Bot Ready Hai!**\n\n' +
      '1. **Baat karo:** Seedha message likho (No /ai needed).\n' +
      '2. **Photo banao:** `/img` likh kar batao kya banana hai.\n' +
      '3. **Reset:** `/reset` dabao agar bot atak jaye.'
    );
  });

  // --- IMAGE GENERATION (HD Quality) ---
  bot.command('img', async (ctx) => {
    const prompt = ctx.message.text.replace('/img', '').trim();
    if (!prompt) return ctx.reply('🎨 Kya banau? Ex: `/img Batman in rain`');

    await ctx.replyWithChatAction('upload_photo');
    
    // High Quality Flux Model use kar raha hu
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;

    try {
      await ctx.replyWithPhoto(imageUrl, { caption: `🎨 Created by AI` });
    } catch (e) {
      ctx.reply('❌ Photo nahi bhej paya.');
    }
  });

  // --- RESET MEMORY ---
  bot.command('reset', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('🧹 Dimag Fresh kar liya!');
  });

  // --- DIRECT CHAT (Smart Handling) ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    
    // Commands ko ignore karo
    if (userText.startsWith('/')) return;

    await ctx.replyWithChatAction('typing');

    // History manage karo
    if (!chatHistory.has(ctx.chat.id)) {
      chatHistory.set(ctx.chat.id, [systemMessage]);
    }

    const history = chatHistory.get(ctx.chat.id);
    history.push({ role: "user", content: userText });

    // Last 15 messages yaad rakho
    if (history.length > 15) {
      const newHistory = [history[0], ...history.slice(history.length - 14)];
      chatHistory.set(ctx.chat.id, newHistory);
    }

    // AI se jawab lo
    const reply = await getAIResponse(chatHistory.get(ctx.chat.id), orApiKey);
    
    // DeepSeek ke "<think>" tags safai se hatao
    const cleanReply = reply.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // History update
    chatHistory.get(ctx.chat.id).push({ role: "assistant", content: cleanReply || reply });
    
    // Jawab bhejo
    await ctx.reply(cleanReply || reply);
  });

  bot.launch();
  console.log("✅ Final Bot is Live!");

  // Graceful Stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
