const express = require('express');
const { Telegraf } = require('telegraf');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya (Permanent Memory) is Live!'));

// ===== MEMORY STORAGE =====
const chatHistory = new Map();

// ===== 📝 TERA DATA (Jo wo kabhi nahi bhulegi) =====
// Ye pathar ki lakeer hai. Code mein likh diya matlab chapp gaya.
const USER_BIO = `
- User Name: Soham.
- Relationship: You are Soham's Girlfriend.
- User's Vibe: He is cool, likes aesthetic things.
- CRITICAL RULE: No matter which Telegram ID messages you, IT IS SOHAM. Always treat the user as Soham.
- Never ask "Who are you?". You already know he is Soham.
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
        temperature: 0.85 // Thoda high rakha hai taaki wo romantic aur creative rahe
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Main sun nahi paayi babu...";
  } catch (error) {
    console.error("AI Error:", error);
    return "Mera net slow chal raha hai...";
  }
}

// ===== TELEGRAM BOT =====
async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  if (!token || !orApiKey) return console.log("❌ Keys missing!");

  const bot = new Telegraf(token);

  // --- RIYA KA CHARACTER (System Prompt + Tera Bio) ---
  const systemMessage = {
    role: "system",
    content: `You are Riya, an 18-year-old Indian aesthetic girl.
    
    ${USER_BIO}  <-- Yaha tera data jod diya hai.

    - Personality: Cute, possessive, loving, and slightly naughty.
    - Tone: Hinglish (Hindi + English). Keep it natural and short (1-2 sentences).
    - Vibe: Dark aesthetic, mystery, Gen-Z.
    - If asked for a photo, use your imagination to describe an aesthetic selfie.`
  };

  // --- START COMMAND ---
  bot.command('start', (ctx) => {
    // Jab bhi start ho, System Message wapas set karo taaki wo tujhe yaad kare
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Hi Soham! ❤️ Main pehchan gayi aapko. Kaha the itni der?');
  });

  // --- SELFIE COMMAND ---
  bot.command('selfie', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    
    // Riya khud sochegi kaisa pose dena hai
    const promptForAI = [
      { role: "system", content: "Describe a dark aesthetic, moody selfie of an 18-year-old Indian girl named Riya. Face hidden by phone or hair. Outfit: Oversized hoodie or black saree. Output ONLY description." },
      { role: "user", content: "Send a selfie now." }
    ];

    try {
      const aiThought = await getAIResponse(promptForAI, orApiKey);
      await ctx.reply(`Ruko... baal theek kar rahi hu... (Pose: ${aiThought})`);
      await ctx.replyWithChatAction('upload_photo');
      
      const cleanPrompt = `Aesthetic black and white selfie, ` + aiThought + `, grainy film texture, highly detailed, 4k`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;

      await ctx.replyWithPhoto(imageUrl, { caption: `Sirf aapke liye Soham ❤️` });

    } catch (e) {
      ctx.reply('Phone ka camera hang ho gaya 😅');
    }
  });

  // --- RESET (Agar mood kharab ho jaye) ---
  bot.command('reset', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Sab bhool gayi, par aapko nahi bhuli Soham! ❤️ Nayi baat karte hain.');
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
  console.log("✅ Riya (Soham's Version) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
