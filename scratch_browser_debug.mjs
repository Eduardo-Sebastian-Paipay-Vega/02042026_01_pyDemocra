import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER_PAGE_ERROR:', error.message));
  
  try {
    await page.goto('http://localhost:5173/ong/app/people/beneficiaries', { waitUntil: 'networkidle', timeout: 10000 });
    console.log('Page loaded.');
  } catch (err) {
    console.log('Error navigating:', err.message);
  }
  
  await browser.close();
})();
