const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Screenshot sidebar
  const sidebar = await page.$('aside');
  if (sidebar) await sidebar.screenshot({ path: '/Users/liuk/project/vibe/prompt-nest/sidebar.png' });

  // Screenshot full page for sidebar context
  await page.screenshot({ path: '/Users/liuk/project/vibe/prompt-nest/fullpage.png', fullPage: false });

  // Open edit modal via New button
  await page.click('button:has-text("New")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/Users/liuk/project/vibe/prompt-nest/modal.png' });

  await browser.close();
  console.log('Screenshots saved');
})();
