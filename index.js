const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Telegraf } = require("telegraf");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   1. WEB SERVER (CRON SAFE)
   ========================= */

app.get("/", (req, res) => {
  res.status(200).send("✅ Bot alive | Gemini 1.5 Flash");
});

// Health check endpoint (USE THIS IN CRON)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`✅ Web server running on port ${PORT}`);
});

/* =========================
   2. TELEGRAM + GEMINI
   ========================= */

async function startTelegramBot() {
  console.log("🚀 Starting Telegram Bot...");

  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const GEMINI_KEY = process.env.GOOGLE_API_KEY;

  if (!TELEGRAM_TOKEN || !GEMINI_KEY) {
    console.error("❌ Missing TELEGRAM_BOT_TOKEN or GOOGLE_API_KEY");
    process.exit(1);
  }

  // Init bot
  const bot = new Telegraf(TELEGRAM_TOKEN);

  // Init Gemini
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);

  // ✅ CORRECT + FUTURE-SAFE MODEL NAME
  const model = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash",
    systemInstruction:
      "You are a helpful Telegram AI assistant. Keep replies clear and concise.",
  });

  /* ---------- Commands ---------- */

  bot.start((ctx) => {
    ctx.reply(
      "⚡ Bot is online using Gemini 1.5 Flash\n\nUse:\n/ai <your question>"
    );
  });

  bot.command("ai", async (ctx) => {
    const prompt = ctx.message.text.replace("/ai", "").trim();

    if (!prompt) {
      return ctx.reply("❌ Empty prompt.\nExample: /ai Explain black holes");
    }

    try {
      await ctx.replyWithChatAction("typing");

      const result = await model.generateContent(prompt);
      const text = result?.response?.text();

      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      await ctx.reply(text.slice(0, 4000)); // Telegram safety limit
      console.log("✅ AI reply sent");

    } catch (err) {
      console.error("❌ AI Error:", err.message);

      if (err.message.includes("404")) {
        ctx.reply("⚠️ Model error. Google API issue.");
      } else if (err.message.includes("quota")) {
        ctx.reply("⚠️ API quota exceeded. Try later.");
      } else {
        ctx.reply("⚠️ AI failed. Try again later.");
      }
    }
  });

  /* ---------- Launch ---------- */

  await bot.launch();
  console.log("✅ Telegram Bot is LIVE");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

startTelegramBot();
