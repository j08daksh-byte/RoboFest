const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  
  const outDir = 'C:\\Users\\j08da\\.gemini\\antigravity-ide\\brain\\6a8050d6-c4b7-4f82-bb4b-be4cf1cc40a0';
  
  // 1. Command Center DARK
  console.log('Navigating to Command Center...');
  await page.goto('http://localhost:3000/command-center', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'command_center_dark.png') });
  console.log('Saved command_center_dark.png');
  
  // 2. Command Center LIGHT
  console.log('Toggling Light Theme...');
  // Find a button with 'THEME' text or something inside topbar to toggle light mode.
  // We can just execute a script to set localStorage and reload, or inject the JS.
  await page.evaluate(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'command_center_light.png') });
  console.log('Saved command_center_light.png');
  
  // Toggle back
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.removeAttribute('data-theme');
  });

  // 3. Robot Twin DARK
  console.log('Navigating to Robot Twin...');
  await page.goto('http://localhost:3000/robot/twin', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'twin_dark.png') });
  console.log('Saved twin_dark.png');
  
  // 4. Robot Twin IMMERSIVE DARK
  console.log('Activating Immersive Mode...');
  // Click the button containing "IMMERSIVE"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const immersiveBtn = buttons.find(b => b.textContent.includes('IMMERSIVE'));
    if (immersiveBtn) immersiveBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'twin_immersive.png') });
  console.log('Saved twin_immersive.png');
  
  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
