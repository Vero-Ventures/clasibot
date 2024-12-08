import type { BrowserContext, Page } from 'playwright-core';
import { BrowserHelper } from '../browser';
import { EmailService } from '../email';
import { CONFIG } from '../../config';
import type { QBOTokenData } from '../../types';

export class QuickBooksAuth {
  constructor(
    private context: BrowserContext,
    private page: Page
  ) {}

  async authenticate(): Promise<QBOTokenData | null> {
    const browserHelper = new BrowserHelper(this.page);
    const emailService = new EmailService();

    try {
      await this.initialLogin(browserHelper);
      try {
        await this.page.waitForSelector(
          CONFIG.selectors.firmSelection.firmSearchInput,
          {
            timeout: 30000,
          }
        );
        console.log('MFA skipped, proceeding to account selection...');
      } catch {
        console.log('MFA required, handling verification...');
        await this.handleMFA(browserHelper, emailService);
      }

      await this.firmSelection(browserHelper);

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 3000);
      });

      // Extract QB auth cookies
      const authCookies = await this.extractAuthCookies();
      if (!authCookies) {
        throw new Error('Failed to extract authentication cookies');
      }

      await this.page.evaluate(() => window.stop());

      return {
        qboTicket: authCookies.qboTicket,
        authId: authCookies.authId,
        agentId: authCookies.agentId,
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
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

    try {
      const emailService = new EmailService();
      await this.handleMFA(browser, emailService);
    } catch {
      console.log('No MFA');
    }

    if (inviteType === 'company') {
      await this.firmSelection(browser, 'invite');
      await browser.waitAndClick(
        CONFIG.selectors.firmSelection.firmAcceptButton
      );
    }

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  }

  private async initialLogin(browser: BrowserHelper): Promise<void> {
    await this.page.goto(CONFIG.quickbooks.loginUrl);
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
    await browser.waitAndClick(CONFIG.selectors.login.mfaSMSOption, 30000);
    const code = await this.waitForVerificationCode(emailService);
    if (!code) throw new Error('Failed to retrieve verification code');
    await browser.waitAndFill(CONFIG.selectors.login.verificationInput, code);
    await browser.waitAndClick(CONFIG.selectors.login.verificationSubmit);
  }

  async firmSelection(
    browser: BrowserHelper,
    selectionType: string = ''
  ): Promise<void> {
    console.log('Firm Select Content');
    console.log(await this.page.content());
    await browser.waitAndFill(
      CONFIG.selectors.firmSelection.firmSearchInput,
      'Clasibot Synthetic Bookkeeper',
      30000
    );
    let firmButtons = this.page.locator(
      CONFIG.selectors.firmSelection.firmSelectionButtonLogin
    );

    if (selectionType === 'invite') {
      firmButtons = this.page.locator(
        CONFIG.selectors.firmSelection.firmSelectionButtonInvite
      );
    }

    try {
      await firmButtons.first().waitFor({ state: 'visible' });
      console.log('Firm Select Content Post Enter');
      console.log(await this.page.content());
      await firmButtons.first().click();
    } catch (error) {
      console.log('Firm Select Content Post Failure');
      console.log(await this.page.content());
      throw error;
    }
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
    const qboTkt = cookies.find((cookie) => cookie.name === 'qbo.ticket');
    const qbnAuthId = cookies.find((cookie) => cookie.name === 'qbn.authid');
    const qbnAgentId = cookies.find((cookie) => cookie.name === 'qbn.agentid');

    if (!qboTkt || !qbnAuthId || !qbnAgentId) {
      console.error('Required auth cookies not found');
      return null;
    }

    console.log(
      `Found auth cookies - tkt: ${qboTkt.value}, authId: ${qbnAuthId.value} agentId: ${qbnAgentId.value}`
    );

    return {
      qboTicket: qboTkt.value,
      authId: qbnAuthId.value,
      agentId: qbnAgentId.value,
    };
  }
}
