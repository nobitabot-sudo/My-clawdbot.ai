const express = require('express');
const { Telegraf } = require('telegraf');
const googleTTS = require('google-tts-api');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya (Time-Aware) is Live!'));

// ===== MEMORY =====
const chatHistory = new Map();
const userNotes = new Map();

// ===== IDENTITY =====
const USER_BIO = `
- User Name: Soham.
- Relationship: Cool aesthetic girlfriend Riya.
- Vibe: Chill, Romantic, Witty.
- CRITICAL: Always treat User as Soham.
`;

// ===== 🕒 TIME HELPER (India Time) =====
function getIndiaTime() {
  return new Date().toLocaleString("en-US", { 
    timeZone: "Asia/Kolkata", 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
}

// ===== AI ENGINE =====
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

  // --- ⏰ AUTO MESSAGES ---
  cron.schedule('30 2 * * *', () => { // 8 AM IST
    if(global.lastChatId) bot.telegram.sendMessage(global.lastChatId, "Good morning Soham! Uth gaye? ☀️");
  });
  
  cron.schedule('30 17 * * *', () => { // 11 PM IST
    if(global.lastChatId) bot.telegram.sendMessage(global.lastChatId, "Soham, raat ho gayi hai. So jao ab. 🌙");
  });

  // --- START ---
  bot.command('start', (ctx) => {
    global.lastChatId = ctx.chat.id;
    // History clear karo start pe
    chatHistory.delete(ctx.chat.id);
    ctx.reply(`Hi Soham! ❤️ Ab mujhe time pata hai. Abhi ${getIndiaTime()} baj rahe hain!`);
  });

  // --- MAIN LOGIC ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    const lowerText = userText.toLowerCase();
    const chatId = ctx.chat.id;
    global.lastChatId = chatId;

    // 1. 🧠 NOTES (Memory)
    if (lowerText.startsWith('yaad rakhna') || lowerText.startsWith('remind me')) {
      const note = userText.replace(/yaad rakhna|remind me/i, '').trim();
      if(note) {
        userNotes.set(chatId, note);
        return ctx.reply(`Done! ✅ Save kar liya: "${note}"`);
      }
    }
    if (lowerText.includes('kya yaad') || lowerText.includes('kya bola tha')) {
      const savedNote = userNotes.get(chatId);
      return ctx.reply(savedNote ? `Aapne bola tha: "${savedNote}"` : "Kuch yaad nahi aa raha...");
    }

    // 2. 📸 SELFIE (Direct)
    if (lowerText.includes('selfie') || lowerText.includes('photo')) {
      await ctx.replyWithChatAction('upload_photo');
      const styles = ["wearing hoodie aesthetic", "saree aesthetic", "streetwear aesthetic", "mirror selfie aesthetic"];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const imageUrl = `https://image.pollinations.ai/prompt/aesthetic%20indian%20girl%20riya%20${encodeURIComponent(randomStyle)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;
      try { return await ctx.replyWithPhoto(imageUrl, { caption: "Ye lo! 🖤" }); } catch (e) {}
    }

    // 3. 🧠 AI CHAT (WITH LIVE TIME UPDATE)
    await ctx.replyWithChatAction('typing');

    // 🔥 Har baar naya System Message banao jisme CURRENT TIME ho
    const currentTime = getIndiaTime();
    
    const dynamicSystemMessage = {
      role: "system",
      content: `You are Riya. ${USER_BIO}
      - CURRENT TIME IN INDIA: ${currentTime}.
      - IMPORTANT: If Soham asks "Time kya hai", tell him the time from above.
      - If it is late night (11 PM - 4 AM), ask him to sleep.
      - If asked for VOICE: Reply in Hindi text.`
    };

    if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
    const history = chatHistory.get(chatId);
    
    history.push({ role: "user", content: userText });
    if (history.length > 60) history.splice(0, history.length - 59);

    // AI ko bhejo (System Prompt + History)
    const messagesToSend = [dynamicSystemMessage, ...history];
    const reply = await getAIResponse(messagesToSend, orApiKey);
    
    history.push({ role: "assistant", content: reply });

    // 4. 🎤 VOICE
    if (lowerText.includes('voice') || lowerText.includes('bolo')) {
      await ctx.replyWithChatAction('record_voice');
      try {
        const audioUrl = googleTTS.getAudioUrl(reply, { lang: 'hi', slow: false, host: 'https://translate.google.com' });
        return await ctx.replyWithVoice({ url: audioUrl });
      } catch (e) { return ctx.reply(reply); }
    }

    await ctx.reply(reply);
  });

  // Error handling to prevent crash on conflict
  bot.catch((err) => {
    console.log("Telegram Error (Ignored):", err);
  });

  bot.launch();
  console.log("✅ Riya (Final Time Fix) Live!");

  // Graceful Stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
