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

  async siteLogin(): Promise<QBOTokenData | null> {
    try {
      // Create a new browser helper with the page value and an email service object.
      const browserHelper = new BrowserHelper(this.page);
      const emailService = new EmailService();

      // Go to the defines site login url and wait for the email input option before filling it.
      await this.page.goto(CONFIG.quickbooks.loginUrl);
      await browserHelper.waitAndFill(
        CONFIG.selectors.login.emailInput,
        CONFIG.quickbooks.email
      );

      // Submit the email, wait for the password input before selecting and filling it.
      await browserHelper.waitAndClick(CONFIG.selectors.login.emailSubmit);
      await browserHelper.waitAndFill(
        CONFIG.selectors.login.passwordInput,
        CONFIG.quickbooks.password
      );

      // Submit the password option to contiune to MFA or Firm selection.
      await browserHelper.waitAndClick(CONFIG.selectors.login.passwordSubmit);

      // Try to call MFA handler to check if MFA page has appeared and to handle the MFA process.
      try {
        await this.handleMFA(browserHelper, emailService);
      } catch {
        // If no MFA page appears, log it and continue without error.
        console.log('No MFA');
      }

      // Call the Firm selection process then wait for the login process to complete.
      await this.firmSelection(browserHelper);
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 3000);
      });

      // Extract the QBO cookies needed from the Synthetic Login.
      const authCookies = await this.extractAuthCookies();

      // If the auth cookies could not be found, throw an error to the Synthetic Login caller.
      if (!authCookies) {
        throw new Error('Failed to extract authentication cookies');
      }

      // Cease loading the page before returning the fetced QBO auth cookies.
      await this.page.evaluate(() => window.stop());
      return {
        qboTicket: authCookies.qboTicket,
        authId: authCookies.authId,
        agentId: authCookies.agentId,
      };
    } catch (error) {
      // Log an error message and throw it to Synthetic Login caller.
      console.error('Site Login Failed:', error);
      throw error;
    }
  }

  async inviteLogin(inviteLink: string, inviteType: string): Promise<void> {
    try {
      // Create a new browser helper with the page value and go the the url passed in the invite link.
      const browserHelper = new BrowserHelper(this.page);
      await this.page.goto(inviteLink);

      // Wait for the email submission option to appear and click continue as it is automatically filled for existing accounts.
      await browserHelper.waitAndClick(CONFIG.selectors.login.emailSubmit);

      // Wait for the password input option and fill it before waiting and selecting the continue button.
      await browserHelper.waitAndFill(
        CONFIG.selectors.login.passwordInput,
        CONFIG.quickbooks.password
      );
      await browserHelper.waitAndClick(CONFIG.selectors.login.passwordSubmit);

      // Try to call MFA handler to check if MFA page has appeared and to handle the MFA process.
      try {
        const emailService = new EmailService();
        await this.handleMFA(browserHelper, emailService);
      } catch {
        // If no MFA page appears, log it and continue without error.
        console.log('No MFA');
      }

      // If the invite is to a company, Firm slection is required.
      if (inviteType === 'company') {
        // Call the Firm selection process then select the continue option.
        await this.firmSelection(browserHelper, 'invite');
        await browserHelper.waitAndClick(
          CONFIG.selectors.firmSelection.firmSelectionAcceptButton
        );
      }

      // Preform short wait before ending to ensure accept process completes Successfully.
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);
      });

      // Cease loading the page before returning.
      await this.page.evaluate(() => window.stop());
    } catch (error) {
      // Log an error message and throw it to Synthetic Login caller.
      console.error('Invite Login Failed:', error);
      throw error;
    }
  }

  private async handleMFA(
    browser: BrowserHelper,
    emailService: EmailService
  ): Promise<void> {
    // Wait for possible MFA page to load before waiting and selecing the SMS option for the MFA code.
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.waitAndClick(CONFIG.selectors.login.mfaSMSOption, 30000);

    // Call email handler to await verification code. Thow an error to Synthetic Login caller on failure.
    const code = await this.waitForEmailVerificationCode(emailService);
    if (!code) {
      throw new Error('Failed To Retrive MFA Code');
    }

    // Wait for the code input to appear before entering the MFA code and submitting it.
    await browser.waitAndFill(CONFIG.selectors.login.mfaInput, code);
    await browser.waitAndClick(CONFIG.selectors.login.mfaSubmit);
  }

  private async waitForEmailVerificationCode(
    emailService: EmailService,
    maxAttempts = 10
  ): Promise<string | null> {
    // Wait 10 seconds for email to arrive.
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Preform check for email a number of times based on maxAttempts values (default 10).
    for (let i = 0; i < maxAttempts; i++) {
      // Try to fetch the latest email using the email service and return the code if it is found.
      try {
        const code = await emailService.fetchLatestEmail();
        if (code) return code;
      } catch (error) {
        // Log an error that the attempt failed if the attempt resulted in an error.
        console.error(`Error During Attempt ${i + 1}:`, error);
      }
      // If there are attempts remaining, wait 5 seconds before next attempt.
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    // Return a null value if the code could not be found.
    return null;
  }

  private async waitForApiVerificationCode(
    maxAttempts = 10
  ): Promise<string | null> {
    // Wait 10 seconds for MFA code to be sent and recived.
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Call API to get the MFA code a number of times based on maxAttempts values (default 10).
    for (let i = 0; i < maxAttempts; i++) {
      // Try to call for the MFA code and check that it is recent, then return the code if it is found.
      try {
        // Call the myMfa API caller to get the MFA code, and return it if it is found.
        const code = await this.callVerificationCode();
        if (code) {
          return code;
        }
      } catch (error) {
        // Log an error that the attempt failed if the attempt resulted in an error.
        console.error(`Error During Attempt ${i + 1}:`, error);
      }
      // If there are attempts remaining, wait 5 seconds before next attempt.
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    // Return a null value if the code could not be found.
    return null;
  }

  private async callVerificationCode(): Promise<string | null> {
    // Define the myMfa API endpoint to call using the Config number Id value.
    const mfaApiUrl = `https://programmatic-api.client.get.mymfa.io/v1/${CONFIG.myMfa.numberId}/mfa/latest`;

    try {
      // Call the myMfa API endpoint with the API key from the config file as a header.
      const response = await fetch(mfaApiUrl, {
        method: 'GET',
        headers: {
          'x-api-key': CONFIG.myMfa.mfaApiKey!,
          'Cache-Control': 'no-cache',
        },
      });

      // Await the body data and extract the key values.
      const data = await response.json();

      if (response.ok) {
        // Extract the timestamp myMfa recived the code and the MFA code itself.
        const recivedTimeStamp = data.recivedDate;
        const recivedCode = data.mfaCode;

        // Get the unix timestamp for 1 minute ago, in case of the new MFA SMS message being not sent.
        // Used to ensure fetched code is the newly generated one, not an old one.
        const recentTimestamp = Math.floor(Date.now() / 1000) - 120;

        // Check that the recived code is recent, and return it if it is.
        if (recivedTimeStamp >= recentTimestamp) {
          return recivedCode;
        } else {
          // If the code is too old to be valid, return null.
          return null;
        }
      } else {
        // If the response is invalid, throw an error to caller with error details.
        throw new Error('Failure Calling MFA Code API');
      }
    } catch (error) {
      // If an error occurs, catch it and throw an error to caller with error details.
      if (error instanceof Error) {
        throw new Error('Error Calling MFA Code API: ' + error.message);
      } else {
        throw new Error('Unexpected Error Calling MFA Code API');
      }
    }
  }

  private async firmSelection(
    browser: BrowserHelper,
    selectionType: string = ''
  ): Promise<void> {
    try {
      // Wait for the Firm search input which can take a while to load, before inputting the Synthetic Bookkeeper Firm name.
      await browser.waitAndFill(
        CONFIG.selectors.firmSelection.searchInput,
        'Clasibot Synthetic Bookkeeper',
        30000
      );

      // Identify the Firm selection buttons based on the passed selection type.
      let firmButtons = this.page.locator(
        CONFIG.selectors.firmSelection.firmSelectionButtonLogin
      );

      if (selectionType === 'invite') {
        firmButtons = this.page.locator(
          CONFIG.selectors.firmSelection.firmSelectionButtonInvite
        );
      }

      // Wait for the Firm selection button to be visible before selecting the Synthetic Bookkeeper Firm.
      await firmButtons.first().waitFor({ state: 'visible' });
      await firmButtons.first().click();
    } catch (error) {
      // Catch any errors and throw them to the caller.
      throw error;
    }
  }

  private async extractAuthCookies(): Promise<{
    qboTicket: string;
    authId: string;
    agentId: string;
  } | null> {
    // Get the site cookies and find the ones needed as part of Synthetic Login.
    const cookies = await this.context.cookies();
    const qboTkt = cookies.find((cookie) => cookie.name === 'qbo.ticket');
    const qbnAuthId = cookies.find((cookie) => cookie.name === 'qbn.authid');
    const qbnAgentId = cookies.find((cookie) => cookie.name === 'qbn.agentid');

    // If one or more cookies could not be found, log an error and return a null value.
    if (!qboTkt || !qbnAuthId || !qbnAgentId) {
      console.error('Required Synthetic Login Cookies Not Found');
      return null;
    }

    // Return the found cookies to the caller.
    return {
      qboTicket: qboTkt.value,
      authId: qbnAuthId.value,
      agentId: qbnAgentId.value,
    };
  }
}
