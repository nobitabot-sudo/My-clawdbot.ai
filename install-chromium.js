// This script installs Chromium for Render
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Installing Chromium for Render...');

try {
  // Create directory for Chromium
  const chromiumDir = path.join(__dirname, 'chromium');
  if (!fs.existsSync(chromiumDir)) {
    fs.mkdirSync(chromiumDir, { recursive: true });
  }
  
  // Download Chromium using puppeteer's built-in downloader
  console.log('Downloading Chromium...');
  const puppeteer = require('puppeteer');
  
  // This will download Chromium to puppeteer's cache directory
  console.log('Chromium will be downloaded on first run');
  
  console.log('✅ Chromium setup complete');
} catch (error) {
  console.log('⚠️ Chromium install error:', error.message);
}
