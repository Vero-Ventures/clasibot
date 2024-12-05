import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';
import { QuickBooksAuth } from './services/quickbooks/auth';
import type { QBOTokenData } from './types';

export const syntheticAuth = async (): Promise<QBOTokenData> => {
  const executablePath = await chromium.executablePath();

  try {
    const browser = await playwright.launch({
      executablePath,
      headless: true,
      args: [
        ...chromium.args,
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      javaScriptEnabled: true,
      bypassCSP: true,
    });
    const cookies = context.cookies();
    console.log('Startup Cookies');
    console.log(cookies);
    context.clearCookies();
    const storageState = await context.storageState();
    const localStorage = storageState.origins.flatMap((origin) =>
      origin.localStorage.map(({ name, value }) => ({ name, value }))
    );
    console.log('Local Storage');
    console.log(localStorage);

    const page = await context.newPage();

    console.log('Page Local Storage');
    console.log(await page.evaluate(() => window.localStorage));
    console.log('Page Session Storage');
    console.log(await page.evaluate(() => window.sessionStorage));

    await page.evaluate(() => window.localStorage.clear());
    await page.evaluate(() => window.sessionStorage.clear());

    console.log('Local Storage Post Clear');
    console.log(page.evaluate(() => window.localStorage));

    console.log('Session Storage Post Clear');
    console.log(page.evaluate(() => window.sessionStorage));

    try {
      const auth = new QuickBooksAuth(context, page);
      const tokenData = await auth.authenticate();

      if (!tokenData) {
        throw new Error('No token data received from authentication');
      }

      return tokenData;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    } finally {
      console.log('Close');
      await browser.close();
    }
  } catch (error) {
    console.error('Browser launch failed:', error);
    throw error;
  }
};

export const syntheticAccept = async (
  inviteLink: string,
  inviteType: string
) => {
  const executablePath = await chromium.executablePath();
  try {
    const browser = await playwright.launch({
      executablePath,
      headless: true,
      args: [
        ...chromium.args,
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      javaScriptEnabled: true,
      bypassCSP: true,
    });

    const page = await context.newPage();

    try {
      const auth = new QuickBooksAuth(context, page);
      await auth.inviteLoginAndAccept(inviteLink, inviteType);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Browser launch failed:', error);
    throw error;
  }
};
