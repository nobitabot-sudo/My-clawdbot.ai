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
app.get('/', (req, res) => res.send('❤️ Riya (Memory & Love Meter) is Live!'));

// ===== STORAGE =====
const chatHistory = new Map();
const userNotes = new Map(); // 🧠 Choti cheezein yaad rakhne ke liye

// ===== IDENTITY =====
const USER_BIO = `
- User Name: Soham.
- Relationship: Cool aesthetic girlfriend Riya.
- Vibe: Chill, Romantic, Witty.
- CRITICAL: Always treat User as Soham.
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
    if(global.lastChatId) bot.telegram.sendMessage(global.lastChatId, "Good morning Soham! Uth gaye? Aaj ka din mast jayega! ☀️");
  });
  
  cron.schedule('30 17 * * *', () => { // 11 PM IST
    if(global.lastChatId) bot.telegram.sendMessage(global.lastChatId, "Soham, abhi tak online? So jao, health kharab hogi. 🌙");
  });

  // --- START ---
  bot.command('start', (ctx) => {
    global.lastChatId = ctx.chat.id;
    ctx.reply('Hi Soham! ❤️ Ab main cheezein yaad bhi rakh sakti hu. Bolo "Yaad rakhna..."');
  });

  // --- MAIN LOGIC ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    const lowerText = userText.toLowerCase();
    const chatId = ctx.chat.id;
    global.lastChatId = chatId;

    // 1. 🧠 YAAD RAKHNA (SET NOTE)
    if (lowerText.startsWith('yaad rakhna') || lowerText.startsWith('remind me')) {
      const note = userText.replace(/yaad rakhna|remind me/i, '').trim();
      if(note) {
        userNotes.set(chatId, note);
        return ctx.reply(`Done! ✅ Dimag mein save kar liya: "${note}"`);
      } else {
        return ctx.reply("Kya yaad rakhna hai? Aage likho toh sahi!");
      }
    }

    // 2. 🧠 KYA BOLA THA? (GET NOTE)
    if (lowerText.includes('kya yaad') || lowerText.includes('what did i say') || lowerText.includes('kya bola tha')) {
      const savedNote = userNotes.get(chatId);
      if (savedNote) {
        return ctx.reply(`Aapne bola tha: "${savedNote}" 🧐`);
      } else {
        return ctx.reply("Mujhe kuch yaad nahi aa raha... shayad aapne kuch bola hi nahi?");
      }
    }

    // 3. 💘 LOVE METER
    if (lowerText.includes('love meter') || lowerText.includes('pyaar') || lowerText.includes('score')) {
      const score = Math.floor(Math.random() * 100);
      let comment = "";
      if (score > 90) comment = "Made for each other! 💍";
      else if (score > 50) comment = "Thoda gussa hu, par chalega. 😘";
      else comment = "Aaj mood off hai mera. 😤";
      
      return ctx.reply(`❤️ Love Level: ${score}%\nOutcome: ${comment}`);
    }

    // 4. 📸 SELFIE & SONG & GAMES (Purana Features)
    if (lowerText.includes('selfie') || lowerText.includes('photo')) {
      await ctx.replyWithChatAction('upload_photo');
      const styles = ["wearing hoodie aesthetic", "saree aesthetic", "streetwear aesthetic"];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const imageUrl = `https://image.pollinations.ai/prompt/aesthetic%20indian%20girl%20riya%20${encodeURIComponent(randomStyle)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;
      try { return await ctx.replyWithPhoto(imageUrl, { caption: "Ye lo! 🖤" }); } catch (e) {}
    }

    if (lowerText.includes('song')) return ctx.reply("Vibe hai isme: https://youtu.be/hTw_q8g26WE?si=Vibe1 🎧");

    // 5. 🧠 AI CHAT
    await ctx.replyWithChatAction('typing');
    const systemMessage = {
      role: "system",
      content: `You are Riya. ${USER_BIO}. 
      If user asks about saved notes, remind him nicely.
      If asked for VOICE: Reply in Hindi text.`
    };

    if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
    const history = chatHistory.get(chatId);
    history.push({ role: "user", content: userText });
    if (history.length > 60) history.splice(0, history.length - 59);

    const messagesToSend = [systemMessage, ...history];
    const reply = await getAIResponse(messagesToSend, orApiKey);
    history.push({ role: "assistant", content: reply });

    // 6. 🎤 VOICE
    if (lowerText.includes('voice') || lowerText.includes('bolo')) {
      await ctx.replyWithChatAction('record_voice');
      try {
        const audioUrl = googleTTS.getAudioUrl(reply, { lang: 'hi', slow: false, host: 'https://translate.google.com' });
        return await ctx.replyWithVoice({ url: audioUrl });
      } catch (e) { return ctx.reply(reply); }
    }

    await ctx.reply(reply);
  });

  bot.launch();
  console.log("✅ Riya (Assistant Mode) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
