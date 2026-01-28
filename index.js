const express = require('express');
const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 10000;

// Initialize Google AI
let genAI = null;
let model = null;

if (process.env.GOOGLE_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('✅ Google AI initialized');
  } catch (error) {
    console.log('❌ Google AI init error:', error.message);
  }
}

// Store data
let botInfo = null;
let userCount = 0;
const userSessions = new Map();

// ... [Keep all the HTML and server code from previous version] ...

// ===== UPDATED BOT COMMANDS WITH AI =====

// Start command (unchanged)
bot.command('start', (ctx) => {
  userCount++;
  const userId = ctx.from.id;
  userSessions.set(userId, {
    name: ctx.from.first_name,
    chatHistory: []
  });
  
  ctx.replyWithMarkdown(`
🤖 *Welcome to ClawdBot!*

I'm now powered by Google Gemini AI! 🧠

*Available Commands:*
/help - Show all commands
/ai [message] - Chat with AI
/clear - Clear chat history
/about - About this bot
/status - Check bot status

*Just send me any message and I'll respond with AI!*

Example: "Hello, how are you?"
  `);
  
  console.log(`👤 New user: ${ctx.from.first_name} (${userId})`);
});

// AI Command
bot.command('ai', async (ctx) => {
  const message = ctx.message.text.replace('/ai', '').trim();
  const userId = ctx.from.id;
  
  if (!message) {
    return ctx.reply('Send: /ai [your question]\nExample: /ai What is quantum computing?');
  }
  
  if (!model) {
    return ctx.reply('❌ AI service not available. Please check API key.');
  }
  
  try {
    // Send typing action
    await ctx.replyWithChatAction('typing');
    
    // Get AI response
    const result = await model.generateContent(message);
    const response = result.response.text();
    
    // Store in history
    if (!userSessions.has(userId)) {
      userSessions.set(userId, { chatHistory: [] });
    }
    userSessions.get(userId).chatHistory.push({ user: message, ai: response });
    
    // Limit history to last 10 messages
    if (userSessions.get(userId).chatHistory.length > 10) {
      userSessions.get(userId).chatHistory.shift();
    }
    
    // Send response (split if too long)
    if (response.length > 4000) {
      const parts = response.match(/[\s\S]{1,4000}/g);
      for (let i = 0; i < parts.length; i++) {
        await ctx.reply(`📝 Part ${i + 1}/${parts.length}:\n\n${parts[i]}`);
      }
    } else {
      await ctx.reply(`🤖 *AI Response:*\n\n${response}`, { parse_mode: 'Markdown' });
    }
    
  } catch (error) {
    console.error('AI Error:', error);
    await ctx.reply('❌ Sorry, I encountered an error. Please try again.');
  }
});

// Clear command
bot.command('clear', (ctx) => {
  const userId = ctx.from.id;
  if (userSessions.has(userId)) {
    userSessions.get(userId).chatHistory = [];
  }
  ctx.reply('✅ Chat history cleared!');
});

// Updated help command
bot.command('help', (ctx) => {
  ctx.replyWithMarkdown(`
*🤖 AI Bot Help Menu*

*AI Commands:*
/ai [message] - Chat with Google Gemini AI
/clear - Clear your chat history

*Basic Commands:*
/start - Start the bot
/help - Show this help
/about - About this bot
/status - Bot status

*How to use:*
1. Use /ai followed by your question
2. Or just send any message (I'll respond with AI)
3. Use /clear to reset conversation

*Example:* /ai Explain quantum computing in simple terms
  `);
});

// Handle ANY text message with AI
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const userId = ctx.from.id;
  
  // Skip if it's a command
  if (userMessage.startsWith('/')) return;
  
  console.log(`💬 ${ctx.from.first_name}: ${userMessage}`);
  
  if (!model) {
    return ctx.reply('AI service is currently unavailable. Please try /ai command.');
  }
  
  try {
    // Send typing indicator
    await ctx.replyWithChatAction('typing');
    
    // Get chat history
    let prompt = userMessage;
    if (userSessions.has(userId)) {
      const history = userSessions.get(userId).chatHistory;
      if (history.length > 0) {
        const context = history.slice(-3).map(h => `User: ${h.user}\nAI: ${h.ai}`).join('\n\n');
        prompt = `Context from previous conversation:\n${context}\n\nCurrent message: ${userMessage}`;
      }
    }
    
    // Get AI response
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Store in history
    if (!userSessions.has(userId)) {
      userSessions.set(userId, { 
        name: ctx.from.first_name,
        chatHistory: [] 
      });
    }
    userSessions.get(userId).chatHistory.push({ 
      user: userMessage, 
      ai: response 
    });
    
    // Limit history
    if (userSessions.get(userId).chatHistory.length > 10) {
      userSessions.get(userId).chatHistory.shift();
    }
    
    // Send response
    await ctx.reply(`🤖 ${response}`);
    
  } catch (error) {
    console.error('AI Error:', error);
    await ctx.reply('❌ Sorry, I had trouble processing that. Try /ai [your question]');
  }
});

// ... [Rest of the code remains same] ...
