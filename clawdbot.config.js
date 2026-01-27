module.exports = {
  core: {
    // Dimaag ko Google par set karo
    llmProvider: 'google',
  },
  platforms: {
    telegram: {
      // Zabardasti ON karo
      enabled: true,
      token: process.env.TELEGRAM_BOT_TOKEN,
    },
    whatsapp: {
      // Zabardasti ON karo
      enabled: true,
    }
  }
};
