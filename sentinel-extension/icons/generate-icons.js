#!/usr/bin/env node
// AEGIS — Icon Generator
// Generates PNG icons from canvas for Chrome extension
// Run: node generate-icons.js (requires node-canvas or use placeholder approach)

const fs = require('fs');
const path = require('path');

// Create minimal 1x1 transparent PNG for placeholder
// Real icons should be replaced with proper 16x16, 48x48, 128x128 PNGs

const png1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

['icon16.png', 'icon48.png', 'icon128.png'].forEach(name => {
  const iconPath = path.join(iconsDir, name);
  if (!fs.existsSync(iconPath)) {
    fs.writeFileSync(iconPath, png1x1);
    console.log(`Created placeholder: ${name}`);
  }
});

console.log('Icon placeholders ready. Replace with real PNG icons for production.');
