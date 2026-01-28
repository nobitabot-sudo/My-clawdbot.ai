const express = require('express');
const { Telegraf } = require('telegraf');
const googleTTS = require('google-tts-api'); 

const app = express();
const PORT = process.env.PORT || 10000;

// ===== SERVER =====
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
app.get('/', (req, res) => res.send('❤️ Riya (Ultimate Edition) is Live!'));

// ===== MEMORY =====
const chatHistory = new Map();

// ===== AESTHETIC SONG LIST 🎵 =====
const aestheticSongs = [
  "https://youtu.be/hTw_q8g26WE?si=Vibe1", // Example Lofi
  "https://youtu.be/5Eqb_-j3FDA?si=Vibe2", // Pasoori or similar
  "https://youtu.be/n6Bd4DeCT5g?si=Vibe3", // Cigarettes After Sex
  "https://youtu.be/T-_P-q4Z_O4?si=Vibe4", // Local Train
  "https://youtu.be/1FliVTcX8bQ?si=Vibe5"  // Prateek Kuhad
];

// ===== HELPER: GET INDIAN TIME 🕒 =====
function getTimeContext() {
  const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const hour = new Date(date).getHours();
  
  if (hour >= 5 && hour < 12) return "It is Morning. Say Good Morning.";
  if (hour >= 12 && hour < 17) return "It is Afternoon.";
  if (hour >= 17 && hour < 21) return "It is Evening.";
  return "It is Late Night. Ask him why he is awake.";
}

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

  // --- START ---
  bot.command('start', (ctx) => {
    // Reset Memory
    chatHistory.delete(ctx.chat.id);
    ctx.reply('Hi Soham! 🖤 Main updated hu. Time, Music aur Photos sab samajhti hu ab!');
  });

  // --- 📸 HANDLE USER PHOTOS (Vision Simulation) ---
  bot.on('photo', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    // Hum assume karenge ki photo Soham ki hai ya kuch cool hai
    const reactions = [
      "Oho! Kya baat hai, bade smart lag rahe ho Soham! 🔥",
      "Ye pic aesthetic hai! Save kar lu? 📸",
      "Looking good baba! 🖤",
      "Nice click! Kaha ki hai ye?"
    ];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    ctx.reply(randomReaction);
  });

  // --- SMART TEXT HANDLING ---
  bot.on('text', async (ctx) => {
    const userText = ctx.message.text.trim();
    const lowerText = userText.toLowerCase();
    const chatId = ctx.chat.id;

    // 1. 🎵 SONG REQUEST
    if (lowerText.includes('song') || lowerText.includes('gana') || lowerText.includes('music')) {
      const randomSong = aestheticSongs[Math.floor(Math.random() * aestheticSongs.length)];
      await ctx.reply("Ye suno, vibes hain isme... 🎧");
      return ctx.reply(randomSong);
    }

    // 2. 📸 SELFIE REQUEST
    if (lowerText.includes('selfie') || lowerText.includes('photo') || lowerText.includes('pic')) {
      await ctx.replyWithChatAction('upload_photo');
      const styles = [
        "wearing a oversized black hoodie, hiding face with phone, mirror selfie",
        "wearing a traditional saree, aesthetic moody lighting",
        "wearing casual streetwear, sitting in a cafe, dark aesthetic",
        "close up aesthetic portrait, messy hair, black and white grainy filter"
      ];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const imageUrl = `https://image.pollinations.ai/prompt/aesthetic%20indian%20girl%20riya%20${encodeURIComponent(randomStyle)}?model=flux&width=1024&height=1024&seed=${Math.random()}&nologo=true`;
      
      try {
        return await ctx.replyWithPhoto(imageUrl, { caption: "Ye lo! 🖤" });
      } catch (e) {
        return ctx.reply("Camera glitch... baad mein try karna.");
      }
    }

    // 3. 🧠 NORMAL CHAT + TIME AWARENESS
    await ctx.replyWithChatAction('typing');
    
    // Dynamic System Prompt (Har message pe time check karegi)
    const timeInfo = getTimeContext();
    const dynamicSystemMessage = {
      role: "system",
      content: `You are Riya, 18yo Indian aesthetic girl.
      ${USER_BIO}
      - CURRENT TIME CONTEXT: ${timeInfo} (React accordingly).
      - Tone: Hinglish, Cool.
      - If user asks for VOICE: Reply in pure Hindi/Hinglish text.`
    };

    if (!chatHistory.has(chatId)) chatHistory.set(chatId, []);
    const history = chatHistory.get(chatId);
    
    // Hamesha latest system prompt use karo (Time update ke liye)
    // Hum history mein system prompt push nahi karenge, bas AI ko bhejte waqt jodenge
    
    history.push({ role: "user", content: userText });
    if (history.length > 60) {
      // Keep only last 59 user/assistant messages
      history.splice(0, history.length - 59);
    }

    // AI Call (System Prompt + History)
    const messagesToSend = [dynamicSystemMessage, ...history];
    const reply = await getAIResponse(messagesToSend, orApiKey);
    
    history.push({ role: "assistant", content: reply });

    // 4. 🎤 VOICE LOGIC
    if (lowerText.includes('voice') || lowerText.includes('bolo') || lowerText.includes('sunao')) {
      await ctx.replyWithChatAction('record_voice');
      try {
        const audioUrl = googleTTS.getAudioUrl(reply, { lang: 'hi', slow: false, host: 'https://translate.google.com' });
        return await ctx.replyWithVoice({ url: audioUrl });
      } catch (e) {
        return ctx.reply(reply);
      }
    }

    await ctx.reply(reply);
  });

  bot.launch();
  console.log("✅ Riya (All Features) Live!");

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startTelegramBot();
