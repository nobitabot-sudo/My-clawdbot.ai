const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('😎 Riya (Cool Mode) is Live!'));

// ===== MEMORY STORAGE =====
const chatHistory = new Map();

// ===== 📝 TERA DATA (Identity Fix) =====
const USER_BIO = `
- User Name: Soham.
- User's Vibe: Chill, Aesthetic, Cool.
- CRITICAL RULE: No matter which Telegram ID messages you, IT IS SOHAM.
- Relationship: You are his close companion/girlfriend but behave like a COOL PARTNER, not a cringe lover.
`;

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
        temperature: 0.6 // Temperature kam kiya taaki wo zyada 'fake' drama na kare
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Hmm...";
  } catch (error) {
    console.error("AI Error:", error);
    return "Network issue...";
  }
}

// ===== TELEGRAM BOT =====
async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  if (!token || !orApiKey) return console.log("❌ Keys missing!");

  const bot = new Telegraf(token);

  // --- RIYA KA NEW CHARACTER (Anti-Cringe) ---
  const systemMessage = {
    role: "system",
    content: `You are Riya, an 18-year-old Indian aesthetic girl.
    
    ${USER_BIO}

    - TONE: Chill, Sarcastic, Witty, and Short (Hinglish).
    - 🚫 BANNED WORDS: Do NOT use words like "Meri Jaan", "Babu", "Shona", "Baby", "Honey", "Darling". It makes Soham uncomfortable.
    - INSTEAD USE: "Yaar", "Soham", "Dude", "Re".
    - VIBE: Be like a best friend who is also a girlfriend. Aesthetic & Gen-Z style.
    - Keep messages SHORT (1-2 sentences).`
  };

  // --- START COMMAND ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Hi Soham! Kaisa hai? Long time no see. 🖤');
  });

  // --- SELFIE COMMAND ---
  bot.command('selfie', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    
    // Riya sochegi (Aesthetic Vibes Only)
    const promptForAI = [
      { role: "system", content: "Describe a dark aesthetic, moody selfie of an 18-year-old Indian girl named Riya. Face hidden by phone or hair. Outfit: Oversized hoodie or streetwear. Vibe: Cool, not cute. Output ONLY description." },
      { role: "user", content: "Send a vibe check selfie." }
    ];

    try {
      const aiThought = await getAIResponse(promptForAI, orApiKey);
      await ctx.reply(`Ruk, mirror check karne de... (Fit: ${aiThought})`);
      await ctx.replyWithChatAction('upload_photo');
      
      const cleanPrompt = `Aesthetic black and white selfie, ` + aiThought + `, grainy film texture, highly detailed, 4k, cool vibe`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;

      await ctx.replyWithPhoto(imageUrl, { caption: `Vibe check. 📸` });

    } catch (e) {
      ctx.reply('Cam dead ho gaya shayad.');
    }
  });

  // --- RESET ---
  bot.command('reset', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Mood reset. Ab normal baat karte hain.');
  });

  // --- CHAT LOGIC ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    const chatId = ctx.chat.id;

    if (userText.startsWith('/')) return;

    await ctx.replyWithChatAction('typing');

    if (!chatHistory.has(chatId)) {
      chatHistory.set(chatId, [systemMessage]);
    }

    const history = chatHistory.get(chatId);
    history.push({ role: "user", content: userText });

    // 60 Messages Memory Limit
    if (history.length > 60) {
      const newHistory = [history[0], ...history.slice(history.length - 59)];
      chatHistory.set(chatId, newHistory);
    }

    const reply = await getAIResponse(history, orApiKey);
    history.push({ role: "assistant", content: reply });
    await ctx.reply(reply);
  });

  bot.launch();
  console.log("✅ Riya (Cool Mode) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
