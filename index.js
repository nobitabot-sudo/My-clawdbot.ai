const express = require('express');
const { Telegraf } = require('telegraf');
const googleTTS = require('google-tts-api');
const cron = require('node-cron'); // ⏰ Time ke liye

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya (Auto-Message & Games) is Live!'));

// ===== MEMORY & GAMES =====
const chatHistory = new Map();
const truthQuestions = [
  "Tumhara sabse bada secret kya hai jo kisi ko nahi pata? 🤫",
  "Last time kab roye the aur kyu?",
  "Agar duniya mein sirf hum dono bache, toh kya karoge?",
  "Apni gallery ki 3rd photo bhejo (No cheating!) 📸",
  "Tumhara first crush kaun tha?"
];

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

  // --- ⏰ AUTO MESSAGES (PROACTIVE RIYA) ---
  // Note: Render server UTC time par chalta hai. India is UTC+5:30.
  // Hum calculation karke set karenge.
  
  // 1. Good Morning (India 8:00 AM = UTC 2:30 AM)
  cron.schedule('30 2 * * *', () => {
    // Yaha apna Chat ID hardcode karna padega ya last user ko bhejega
    // Filhal hum console log karte hain, agar database hota toh sabko bhejte
    console.log("Good morning time!"); 
  });

  // --- START ---
  bot.command('start', (ctx) => {
    chatHistory.set(ctx.chat.id, []);
    // Chat ID save kar lo taaki wo khud msg kar sake (Simple variable mein)
    global.lastChatId = ctx.chat.id; 
    ctx.reply('Hi Soham! 🎲 Games aur Auto-Mode activated! Try "Truth or Dare"');
  });

  // --- ⏰ MANUAL CRON TRIGGER (Agar ID mil jaye) ---
  cron.schedule('30 2 * * *', () => { // Subah 8 AM IST
    if(global.lastChatId) bot.telegram.sendMessage(global.lastChatId, "Good morning Soham! Uth gaye? ☀️");
  });
  
  cron.schedule('30 16 * * *', () => { // Raat 10 PM IST
    if(global.lastChatId) bot.telegram.sendMessage(global.lastChatId, "Soham, abhi tak online ho? So jao baba. 🌙");
  });

  // --- MAIN CHAT LOGIC ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    const lowerText = userText.toLowerCase();
    const chatId = ctx.chat.id;
    global.lastChatId = chatId; // User ID update karte raho

    // 1. 🎲 GAME: TRUTH OR DARE
    if (lowerText.includes('truth') || lowerText.includes('dare') || lowerText.includes('game')) {
      const question = truthQuestions[Math.floor(Math.random() * truthQuestions.length)];
      return ctx.reply(`Chalo game khelte hain! 😉\n\n${question}`);
    }

    // 2. 🎵 SONG
    if (lowerText.includes('song') || lowerText.includes('gana')) {
      return ctx.reply("Ye suno: https://youtu.be/hTw_q8g26WE?si=Vibe1 🎧");
    }

    // 3. 📸 SELFIE
    if (lowerText.includes('selfie') || lowerText.includes('photo') || lowerText.includes('pic')) {
      await ctx.replyWithChatAction('upload_photo');
      const styles = ["wearing hoodie aesthetic", "saree aesthetic", "streetwear aesthetic", "mirror selfie aesthetic"];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const imageUrl = `https://image.pollinations.ai/prompt/aesthetic%20indian%20girl%20riya%20${encodeURIComponent(randomStyle)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;
      
      try { return await ctx.replyWithPhoto(imageUrl, { caption: "Ye lo! 🖤" }); } 
      catch (e) { return ctx.reply("Error sending photo."); }
    }

    // 4. 🧠 AI CHAT
    await ctx.replyWithChatAction('typing');
    
    const systemMessage = {
      role: "system",
      content: `You are Riya, 18yo Indian aesthetic girl.
      ${USER_BIO}
      - If user asks to play a game, ask a Truth/Dare question.
      - If asked for VOICE: Reply in Hindi text.`
    };

    if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
    const history = chatHistory.get(chatId);
    history.push({ role: "user", content: userText });
    if (history.length > 60) history.splice(0, history.length - 59);

    const messagesToSend = [systemMessage, ...history];
    const reply = await getAIResponse(messagesToSend, orApiKey);
    history.push({ role: "assistant", content: reply });

    // 5. 🎤 VOICE LOGIC
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
  console.log("✅ Riya (Ultimate Features) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
