import type { Page } from 'playwright-core';

import type { QBOFirmClientResponse } from '../types';

export class BrowserHelper {
  constructor(private page: Page) {}

  async waitAndClick(selector: string, timeout = 10000): Promise<void> {
    try {
      const element = await this.page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      await element.click();
    } catch (error) {
      throw error;
    }
  }

  async waitAndFill(
    selector: string,
    text: string,
    timeout: number = 10000
  ): Promise<void> {
    try {
      const element = await this.page.waitForSelector(selector, {
        state: 'visible',
        timeout,
      });
      if (!element) {
        throw new Error(`Input not found: ${selector}`);
      }

      await element.click();
      await this.page.waitForTimeout(1000);
      await this.page.fill(selector, text);
    } catch (error) {
      throw error;
    }
  }

  async clearAndFill(selector: string, text: string): Promise<void> {
    try {
      await this.waitAndClick(selector);
      await this.page.keyboard.press('Control+A');
      await this.page.keyboard.press('Backspace');
      await this.page.fill(selector, text);
    } catch (error) {
      throw error;
    }
  }

  async waitForNetworkResponse(
    urlIncludes: string,
    timeout = 10000
  ): Promise<QBOFirmClientResponse> {
    try {
      const response = await this.page.waitForResponse(
        (response) => response.url().includes(urlIncludes),
        { timeout }
      );
      return response.json();
    } catch (error) {
      console.error(
        `Failed to get network response for ${urlIncludes}:`,
        error
      );
      throw error;
    }
  }
}
