import type { BrowserContext, Page } from 'playwright-core';
import { BrowserHelper } from '../browser';
import { EmailService } from '../email';
import { AccountSelector } from './account-selector';
import { CONFIG } from '../../config';
import type { QBOTokenData } from '../../types';

export class QuickBooksAuth {
  private authCookies: {
    qboTicket: string;
    authId: string;
    agentId: string;
  } | null = null;

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

      try {
        const isOnConfirmPage = await Promise.race([
          this.page.waitForURL(
            (url) =>
              url.href.includes(
                'appcenter.intuit.com/app/connect/oauth2/authorize'
              ),
            { timeout: 5000 }
          ),
          this.page.waitForSelector('button:has-text("Next")', {
            timeout: 5000,
          }),
        ]);

        if (isOnConfirmPage) {
          console.log('On confirmation page, clicking connect button...');
          await this.page.click('button:has-text("Connect")');
        }
      } catch {
        console.log('No confirmation page found, proceeding with redirect...');
      }

      // Wait for redirect and get session token from cookies
      await this.page.waitForURL((url) => url.href.includes('clasibot'), {
        timeout: 45000,
      });
      await this.page.evaluate(() => window.stop());

      return {
        qboTicket: this.authCookies.qboTicket,
        authId: this.authCookies.authId,
        agentId: this.authCookies.agentId,
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  private async initialLogin(browser: BrowserHelper): Promise<void> {
    await this.page.goto(process.env.CLASIBOT_URL!);
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

  async inviteLoginAndAccept(
    inviteLink: string,
    inviteType: string
  ): Promise<void> {
    const browser = new BrowserHelper(this.page);
    await this.page.goto(inviteLink);
    await browser.waitAndClick(CONFIG.selectors.login.emailSubmit);
    await browser.waitAndFill(
      CONFIG.selectors.login.passwordInput,
      CONFIG.quickbooks.password
    );
    await browser.waitAndClick(CONFIG.selectors.login.passwordSubmit);
    if (inviteType === 'company') {
      const firmInput = await this.page.waitForSelector(
        CONFIG.selectors.firmSelection.inviteSearchInput
      );
      await firmInput.click();
      await firmInput.fill('Clasibot Synthetic Bookkeeper');

      const options = this.page.locator(
        CONFIG.selectors.firmSelection.inviteListItem
      );
      await options.first().waitFor({ state: 'visible' });
      await options.first().click();
      await browser.waitAndClick(
        CONFIG.selectors.firmSelection.inviteFirmAcceptButton
      );
    }
  }

  private async handleMFA(
    browser: BrowserHelper,
    emailService: EmailService
  ): Promise<void> {
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
    agentId: string;
  } | null> {
    const cookies = await this.context.cookies();
    const qbnTkt = cookies.find((cookie) => cookie.name === 'qbn.tkt');
    const qbnAuthId = cookies.find((cookie) => cookie.name === 'qbn.authid');
    const qbnAgentId = cookies.find((cookie) => cookie.name === 'qbn.agentId');

    if (!qbnTkt || !qbnAuthId || !qbnAgentId) {
      console.error('Required auth cookies not found');
      return null;
    }

    console.log(
      `Found auth cookies - tkt: ${qbnTkt.value}, authId: ${qbnAuthId.value} agentId: ${qbnAgentId.value}`
    );

    return {
      qboTicket: qbnTkt.value,
      authId: qbnAuthId.value,
      agentId: qbnAgentId.value,
    };
  }
}
