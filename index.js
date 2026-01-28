const express = require('express');
const { Telegraf } = require('telegraf');
const googleTTS = require('google-tts-api'); 

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya (Fixed Images) is Live!'));

// ===== MEMORY =====
const chatHistory = new Map();

// ===== IDENTITY =====
const USER_BIO = `
- User Name: Soham.
- Relationship: You are his cool, aesthetic girlfriend Riya.
- Vibe: Chill, Romantic but Witty.
- CRITICAL: Always treat User as Soham.
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
    - No Cringe words.
    - If user asks for VOICE/SPEAK: Reply in pure Hindi/Hinglish text.`
  };

  // --- START ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, [systemMessage]);
    ctx.reply('Hi Soham! 📸 Images fix ho gayi hain. Ab try karo "Selfie bhejo"');
  });

  // --- SMART HANDLING ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    const lowerText = userText.toLowerCase();
    const chatId = ctx.chat.id;

    // 1. 📸 IMAGE LOGIC (FIXED & FAST)
    if (lowerText.includes('selfie') || lowerText.includes('photo') || lowerText.includes('pic') || lowerText.includes('img')) {
      
      await ctx.replyWithChatAction('upload_photo');

      // Random Style Selector (Taaki har baar alag aaye)
      const styles = [
        "wearing a oversized black hoodie, hiding face with phone, mirror selfie",
        "wearing a traditional saree, aesthetic moody lighting, back profile",
        "wearing casual streetwear, sitting in a cafe, dark aesthetic",
        "close up aesthetic portrait, messy hair, black and white grainy filter",
        "wearing a kurti, standing on a terrace, sunset vibe, face slightly hidden"
      ];
      
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      
      // Direct URL Construction
      const prompt = `Aesthetic Indian girl 18 year old named Riya, ${randomStyle}, photorealistic, 4k, high quality`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;

      try {
        return await ctx.replyWithPhoto(imageUrl, { caption: "Ye lo! 🖤" });
      } catch (error) {
        return ctx.reply("❌ Photo upload fail ho gayi. Dobara try karo.");
      }
    }

    // 2. 🎤 VOICE LOGIC
    if (lowerText.includes('voice') || lowerText.includes('bolo') || lowerText.includes('sunao')) {
      await ctx.replyWithChatAction('record_voice');
      
      // History fetch karo jawab dene ke liye
      if (!chatHistory.has(chatId)) chatHistory.set(chatId, [systemMessage]);
      const history = chatHistory.get(chatId);
      
      // AI se text mango
      const aiReply = await getAIResponse(history, orApiKey);
      
      try {
        const audioUrl = googleTTS.getAudioUrl(aiReply, { lang: 'hi', slow: false, host: 'https://translate.google.com' });
        return await ctx.replyWithVoice({ url: audioUrl });
      } catch (e) {
        return ctx.reply(aiReply); // Agar voice fail hui toh text bhej do
      }
    }

    // 3. 💬 NORMAL CHAT
    await ctx.replyWithChatAction('typing');
    if (!chatHistory.has(chatId)) chatHistory.set(chatId, [systemMessage]);
    const history = chatHistory.get(chatId);
    history.push({ role: "user", content: userText });

    if (history.length > 60) {
      const newHistory = [history[0], ...history.slice(history.length - 59)];
      chatHistory.set(chatId, newHistory);
    }

    const reply = await getAIResponse(history, orApiKey);
    history.push({ role: "assistant", content: reply });
    await ctx.reply(reply);
  });

  bot.launch();
  console.log("✅ Riya (Final Fixed Version) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
