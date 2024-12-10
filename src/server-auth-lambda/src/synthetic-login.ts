import { chromium as playwright } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';

import chromium from '@sparticuz/chromium';

import { QuickBooksAuth } from './services/quickbooks/auth';

import type { QBOTokenData } from './types';

export const siteLogin = async (): Promise<QBOTokenData> => {
  try {
    // Get the browser, browser context, and page using chromium.
    const [browser, context, page] = await createChromiunm();

    try {
      // Define auth object to contain the context and page, then call the method to preform site login.
      const auth = new QuickBooksAuth(context, page);
      const tokenData = await auth.siteLogin();

      // Check for a valid set of token data to be returned and throw an error if they are not found.
      if (!tokenData) {
        throw new Error('No token data received from authentication');
      }

      // Return the token data to the lamda caller.
      return tokenData;
    } catch (error) {
      // On error, log an error message and throw it to the lambda caller.
      console.error('Site Login Failed:', error);
      throw error;
    } finally {
      // Regardless of outcome, close the browser page.
      await browser.close();
    }
  } catch (error) {
    // Catch and throw errors to lambda caller.
    throw error;
  }
};

export const inviteAccept = async (inviteLink: string, inviteType: string) => {
  try {
    // Get the browser, browser context, and page using chromium.
    const [browser, context, page] = await createChromiunm();

    try {
      // Define auth object to contain the context and page, then call the method to preform invite accepting.
      const auth = new QuickBooksAuth(context, page);
      await auth.inviteLogin(inviteLink, inviteType);
    } catch (error) {
      // On error, log an error message and throw it to the lambda caller.
      console.error('Invite Accept Failed:', error);
      throw error;
    } finally {
      // Regardless of outcome, close the browser page.
      await browser.close();
    }
  } catch (error) {
    // Catch and throw errors to lambda caller.
    throw error;
  }
};

async function createChromiunm(): Promise<[Browser, BrowserContext, Page]> {
  const executablePath = await chromium.executablePath();

  try {
    // Create and return browser, context, and page objects.
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

    return [browser, context, page];
  } catch (error) {
    // Catch and log any errors before throwing an error to the lambda caller.
    console.error('Browser Launch Failed:', error);
    throw error;
  }
}
