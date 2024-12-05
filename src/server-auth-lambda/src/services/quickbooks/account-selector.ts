import type { Page } from 'playwright-core';
import { CONFIG } from '../../config';
import type { QBOFirmClientResponse } from '../../types';

export class AccountSelector {
  constructor(private page: Page) {}

  async selectAccounts(realmId: string, firmName: string): Promise<void> {
    try {
      if (firmName !== 'null') {
        await this.searchAndSelectFirm(firmName, realmId);
      } else {
        await this.selectDefaultFirm(realmId);
      }
    } catch (error) {
      console.error('Failed to select accounts:', error);
      throw error;
    }
  }

  private async selectDefaultFirm(realmId: string): Promise<void> {
    const firmInput = await this.page.waitForSelector(
      CONFIG.selectors.firmSelection.searchInput
    );
    await firmInput.click();
    await firmInput.fill('Clasibot Synthetic Bookkeeper');

    const options = this.page.locator(CONFIG.selectors.firmSelection.listItem);
    await options.first().waitFor({ state: 'visible' });

    await options.first().click();
    await this.selectCompanyByRealmId(realmId);
  }

  private async searchAndSelectFirm(
    firmName: string,
    realmId: string
  ): Promise<void> {
    const firmInput = await this.page.waitForSelector(
      CONFIG.selectors.firmSelection.searchInput
    );
    await firmInput.click();
    await firmInput.fill(firmName);

    const options = this.page.locator(CONFIG.selectors.firmSelection.listItem);
    await options.first().waitFor({ state: 'visible' });
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      await options.nth(i).click();

      const response = await this.page.waitForResponse((response) =>
        response.url().includes('firmClients')
      );
      const data: QBOFirmClientResponse = await response.json();

      if (data.userRealms.some((realm) => realm.realmId === realmId)) {
        await this.selectCompanyByRealmId(realmId);
        return;
      }

      if (i < count - 1) {
        await firmInput.click();
      }
    }

    throw new Error(
      `Could not find firm "${firmName}" with access to realmId ${realmId} among ${count} options`
    );
  }

  private async selectCompanyByRealmId(realmId: string): Promise<void> {
    const response = await this.page.waitForResponse((response) =>
      response.url().includes('firmClients')
    );
    const data: QBOFirmClientResponse = await response.json();

    const company = data.userRealms.find((realm) => {
      const matches = realm.realmId === realmId;
      return matches;
    });

    if (!company) {
      throw new Error(`Company with realmId ${realmId} not found`);
    }

    const companyInput = await this.page.waitForSelector(
      CONFIG.selectors.companySelection.searchInput
    );
    await companyInput.click();
    await companyInput.fill(company.companyName);

    const options = this.page.locator(
      CONFIG.selectors.companySelection.listItem
    );
    await options.first().waitFor({ state: 'visible' });
    await options.first().click();

    const nextButton = this.page.getByText('Next');
    await nextButton.click();
  }
}
