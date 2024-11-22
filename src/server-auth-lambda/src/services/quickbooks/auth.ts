import type { BrowserContext, Page } from 'playwright';
import { BrowserHelper } from '../browser';
import { EmailService } from '../email';
import { AccountSelector } from './account-selector';
import { CONFIG } from '../../config';
import type { QBOTokenData } from '../../types';

export class QuickBooksAuth {
  private authCookies: { qboTicket: string; authId: string } | null = null;

  constructor(
    private context: BrowserContext,
    private page: Page
  ) {}

  async authenticate(
    realmId: string,
    firmName: string | null
  ): Promise<QBOTokenData | null> {
    const browserHelper = new BrowserHelper(this.page);
    const emailService = new EmailService();
    const accountSelector = new AccountSelector(this.page);

    try {
      await this.initialLogin(browserHelper);
      try {
        await this.page.waitForSelector('text=Please select your company', {
          timeout: 5000,
        });
        console.log('MFA skipped, proceeding to account selection...');
      } catch {
        console.log('MFA required, handling verification...');
        await this.handleMFA(browserHelper, emailService);
      }

      // Extract QB auth cookies
      this.authCookies = await this.extractAuthCookies();
      if (!this.authCookies) {
        throw new Error('Failed to extract authentication cookies');
      }

      await accountSelector.selectAccounts(realmId, firmName);

      // Wait for redirect and get session token from cookies
      await this.page.waitForURL(
        (url) => url.href.startsWith(`${process.env.CLASIBOT_URL}`),
        { timeout: 30000 }
      );
      await this.page.evaluate(() => window.stop());

      const cookies = await this.context.cookies();
      const sessionCookie = cookies.find(
        (c) => c.name === '__Secure-next-auth.session-token'
      );
      if (!sessionCookie) {
        throw new Error('Session token cookie not found after redirect');
      }

      return {
        qboTicket: this.authCookies.qboTicket,
        authId: this.authCookies.authId,
        nextSessionToken: sessionCookie.value,
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  private async initialLogin(browser: BrowserHelper): Promise<void> {
    await this.page.goto(process.env.CLASIBOT_URL!);
    await browser.waitAndClick(CONFIG.selectors.login.appSignInButton);
    await browser.waitAndFill(
      CONFIG.selectors.login.emailInput,
      CONFIG.quickbooks.email
    );
    await browser.waitAndClick(CONFIG.selectors.login.emailSubmit);
    await browser.waitAndFill(
      CONFIG.selectors.login.passwordInput,
      CONFIG.quickbooks.password
    );
    await browser.waitAndClick(CONFIG.selectors.login.passwordSubmit);
  }

  private async handleMFA(
    browser: BrowserHelper,
    emailService: EmailService
  ): Promise<void> {
    console.log('Current URL:', await this.page.url());
    console.log('Page content:', await this.page.content());

    await browser.waitAndClick(CONFIG.selectors.login.mfaEmailOption, 30000);
    const code = await this.waitForVerificationCode(emailService);
    if (!code) throw new Error('Failed to retrieve verification code');

    await browser.waitAndFill(CONFIG.selectors.login.verificationInput, code);
    await browser.waitAndClick(CONFIG.selectors.login.verificationSubmit);
  }

  private async waitForVerificationCode(
    emailService: EmailService,
    maxAttempts = 10
  ): Promise<string | null> {
    await new Promise((resolve) => setTimeout(resolve, 10000));

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const code = await emailService.fetchLatestEmail();
        if (code) return code;
      } catch (error) {
        console.error(`Error during attempt ${i + 1}:`, error);
      }
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    return null;
  }

  private async extractAuthCookies(): Promise<{
    qboTicket: string;
    authId: string;
  } | null> {
    const cookies = await this.context.cookies();
    const qbnTkt = cookies.find((cookie) => cookie.name === 'qbn.tkt');
    const qbnAuthId = cookies.find((cookie) => cookie.name === 'qbn.authid');

    if (!qbnTkt || !qbnAuthId) {
      console.error('Required auth cookies not found');
      return null;
    }

    console.log(
      `Found auth cookies - tkt: ${qbnTkt.value}, authId: ${qbnAuthId.value}`
    );
    return {
      qboTicket: qbnTkt.value,
      authId: qbnAuthId.value,
    };
  }
}
