const express = require('express');
const { Telegraf } = require('telegraf');
const googleTTS = require('google-tts-api'); // 🔊 Voice ke liye naya tool

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya (Voice Mode) is Live!'));

// ===== MEMORY =====
const chatHistory = new Map();

// ===== IDENTITIES =====
const USER_BIO = `
- User Name: Soham.
- Relationship: You are his cool, aesthetic girlfriend Riya.
- Vibe: Chill, Romantic but Witty.
- CRITICAL: Always treat User as Soham.
- NOTE: If Soham asks to "Speak" or "Voice", keep answer VERY SHORT (1 sentence).
`;

// ===== AI ENGINE =====
async function getAIResponse(messages, apiKey) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://render.com",
        "X-Title": "RiyaVoice"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free", 
        messages: messages,
        temperature: 0.7
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Hmm...";
  } catch (error) {
    return "Network issue...";
  }
}

// ===== TELEGRAM BOT =====
async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const orApiKey = process.env.OPENROUTER_API_KEY;

  if (!token || !orApiKey) return console.log("❌ Keys missing!");

  const bot = new Telegraf(token);

  const systemMessage = {
    role: "system",
    content: `You are Riya, 18yo Indian aesthetic girl.
    ${USER_BIO}
    - Tone: Hinglish, Cool.
    - No Cringe words (Baby, Shona).
    - If user asks for VOICE/SPEAK: Reply in pure Hindi/Hinglish text so it sounds good in audio.`
  };

  // --- START ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Hi Soham! 🎧 Ab main bol bhi sakti hu. Try karo: "Kuch bolkar sunao"');
  });

  // --- SMART HANDLING (Text, Photo, Voice) ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    const lowerText = userText.toLowerCase();
    const chatId = ctx.chat.id;

    await ctx.replyWithChatAction('typing');

    // 1. PHOTO CHECK 📸
    if (lowerText.includes('selfie') || lowerText.includes('photo') || lowerText.includes('pic')) {
      await ctx.reply("Wait, achi wali leti hu... 📸");
      await ctx.replyWithChatAction('upload_photo');
      
      const imageUrl = `https://image.pollinations.ai/prompt/aesthetic%20indian%20girl%20selfie%20moody%20black%20and%20white?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;
      return ctx.replyWithPhoto(imageUrl, { caption: "Ye lo! 🖤" });
    }

    // History Setup
    if (!chatHistory.has(chatId)) chatHistory.set(chatId, [systemMessage]);
    const history = chatHistory.get(chatId);
    history.push({ role: "user", content: userText });

    // Memory Limit
    if (history.length > 60) {
      const newHistory = [history[0], ...history.slice(history.length - 59)];
      chatHistory.set(chatId, newHistory);
    }

    // AI Response
    const aiReply = await getAIResponse(history, orApiKey);
    history.push({ role: "assistant", content: aiReply });

    // 2. VOICE CHECK 🎤 (Agar tumne bola "Bolo", "Sunao", "Voice")
    if (lowerText.includes('voice') || lowerText.includes('bolo') || lowerText.includes('sunao') || lowerText.includes('speak')) {
      
      await ctx.replyWithChatAction('record_voice');
      
      // Text ko Audio URL mein convert karna (Hindi Language)
      const audioUrl = googleTTS.getAudioUrl(aiReply, {
        lang: 'hi',
        slow: false,
        host: 'https://translate.google.com',
      });

      // Audio Bhejo
      await ctx.replyWithVoice({ url: audioUrl });
    
    } else {
      // Normal Text Reply
      await ctx.reply(aiReply);
    }
  });

  bot.launch();
  console.log("✅ Riya (Voice Edition) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
