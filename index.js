const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya (Selfie Mode) is Online!'));

// ===== MEMORY =====
const chatHistory = new Map();

// ===== AI ENGINE (Llama 3.3) =====
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
        temperature: 0.8 // Thoda creativity badhaya taaki wo alag alag kapde choose kare
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Kuch samajh nahi aaya...";
  } catch (error) {
    console.error("AI Error:", error);
    return "Net issue hai baba...";
  }
}

// ===== TELEGRAM BOT =====
async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  if (!token || !orApiKey) return console.log("❌ Keys missing!");

  const bot = new Telegraf(token);

  // --- CHARACTER ---
  const systemMessage = {
    role: "system",
    content: `You are Riya, Soham's cute Indian girlfriend.
    - Tone: Sweet, short, slightly romantic, Hinglish.
    - Role: You decide your own style.
    - Safety: Keep it decent and cute.
    - Answer length: Very short (1-2 sentences).`
  };

  // --- START ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Hi Soham! ❤️ Main ready hu. Mujhe bolo `/selfie` aur main apni marzi ki photo bhejungi!');
  });

  // --- MANUAL IMG (Agar tum khud batana chaho) ---
  bot.command('img', async (ctx) => {
    const prompt = ctx.message.text.replace('/img', '').trim();
    if (!prompt) return ctx.reply('Arre, batao toh kya banau?');
    await generateAndSendImage(ctx, prompt);
  });

  // --- 🔥 NEW: SELFIE COMMAND (Riya Decides!) ---
  bot.command('selfie', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    
    // Step 1: Hum AI se puchenge ki wo aaj kaisi dikh rahi hai
    // Hum user ko nahi batayenge ki ye prompt generate ho raha hai
    const promptForAI = [
      { role: "system", content: "You are an image prompt generator. Describe a cute selfie of an Indian girl named Riya in 10 words. Choose a random outfit (saree, jeans, kurti, dress) and a random location (cafe, home, park). Output ONLY the description." },
      { role: "user", content: "Generate a new look for today." }
    ];

    try {
      // Riya ka dimag soch raha hai...
      const aiThought = await getAIResponse(promptForAI, orApiKey);
      
      // Step 2: Jo usne socha, uski photo banao
      await ctx.reply(`Ruk jao, main ready ho rahi hu... (Thinking: ${aiThought})`);
      await ctx.replyWithChatAction('upload_photo');
      
      const cleanPrompt = `A high quality selfie of ` + aiThought;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;

      await ctx.replyWithPhoto(imageUrl, { caption: `Ye lo! Kaisi lag rahi hu aaj? 😘` });

    } catch (e) {
      ctx.reply('Camera kharab ho gaya shayad 😅');
    }
  });

  // --- RESET ---
  bot.command('reset', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Theek hai, mood refresh! ✨');
  });

  // --- CHAT ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    if (userText.startsWith('/')) return;

    await ctx.replyWithChatAction('typing');

    if (!chatHistory.has(ctx.chat.id)) {
      chatHistory.set(ctx.chat.id, [systemMessage]);
    }
    const history = chatHistory.get(ctx.chat.id);
    history.push({ role: "user", content: userText });

    // AI Reply
    const reply = await getAIResponse(history, orApiKey);
    history.push({ role: "assistant", content: reply });
    
    await ctx.reply(reply);
  });

  bot.launch();
  console.log("✅ Riya (Selfie Edition) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

async function generateAndSendImage(ctx, prompt) {
  await ctx.replyWithChatAction('upload_photo');
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;
  try {
    await ctx.replyWithPhoto(imageUrl, { caption: `📸 Created by Riya` });
  } catch (e) {
    ctx.reply('Error sending photo.');
  }
}

startTelegramBot();
