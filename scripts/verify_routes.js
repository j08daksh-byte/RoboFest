const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const routes = [
    '/',
    '/command-center',
    '/robot/twin',
    '/operations',
    '/operations/cut-strategy',
    '/safety',
    '/ship',
    '/intelligence',
    '/records',
    '/system'
  ];

  let allPassed = true;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });

  for (const route of routes) {
    console.log(`Checking http://localhost:3000${route}...`);
    try {
      const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
      if (!response.ok()) {
        console.error(`Error: Route ${route} returned status ${response.status()}`);
        allPassed = false;
      } else {
        console.log(`Success: Route ${route} loaded with status ${response.status()}`);
        
        // Ensure Twin renders on relevant routes
        if (route === '/command-center' || route === '/robot/twin') {
            const hasCanvas = await page.$('canvas');
            if (!hasCanvas) {
                console.error(`Error: Canvas (Digital Twin) not found on ${route}`);
                allPassed = false;
            } else {
                console.log(`Success: Canvas found on ${route}`);
            }
        }
      }
    } catch (err) {
      console.error(`Failed to load ${route}: ${err.message}`);
      allPassed = false;
    }
  }

  await browser.close();
  
  if (allPassed) {
    console.log("All routes verified successfully.");
    process.exit(0);
  } else {
    console.error("Some routes failed verification.");
    process.exit(1);
  }
})();
