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

    const page = await context.newPage();

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
