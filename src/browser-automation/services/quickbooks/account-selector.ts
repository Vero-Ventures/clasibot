import type { Page } from 'playwright';
import { CONFIG } from '../../config';
import type { QBOFirmClientResponse } from '@/browser-automation/types';

export class AccountSelector {
  constructor(private page: Page) {}

  async selectAccounts(
    realmId: string,
    firmName: string | null
  ): Promise<void> {
    try {
      if (firmName) {
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
    console.log('Selecting default Clasibot firm...');
    const firmInput = await this.page.waitForSelector(
      CONFIG.selectors.firmSelection.searchInput
    );
    await firmInput.click();
    await firmInput.fill('Clasibot Synthetic Bookkeeper');

    const options = this.page.locator(CONFIG.selectors.firmSelection.listItem);
    await options.first().waitFor({ state: 'visible' });
    const count = await options.count();

    console.log(`Found ${count} options in dropdown`);

    await options.first().click();
    await this.selectCompanyByRealmId(realmId);
  }

  private async searchAndSelectFirm(
    firmName: string,
    realmId: string
  ): Promise<void> {
    console.log(`Searching for firm: ${firmName}`);

    const firmInput = await this.page.waitForSelector(
      CONFIG.selectors.firmSelection.searchInput
    );
    await firmInput.click();
    await firmInput.fill(firmName);

    const options = this.page.locator(CONFIG.selectors.firmSelection.listItem);
    await options.first().waitFor({ state: 'visible' });
    const count = await options.count();

    console.log(`Found ${count} matching firms for "${firmName}"`);

    for (let i = 0; i < count; i++) {
      console.log(`Trying option ${i + 1} of ${count}`);
      await options.nth(i).click();

      const response = await this.page.waitForResponse((response) =>
        response.url().includes('firmClients')
      );
      const data: QBOFirmClientResponse = await response.json();

      if (data.userRealms.some((realm) => realm.realmId === realmId)) {
        console.log('Found firm with target company');
        await this.selectCompanyByRealmId(realmId);
        return;
      }

      console.log('Company not found in this firm, trying next...');
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

    console.log('FirmClients response received:', {
      realmCount: data.userRealms.length,
      availableRealmIds: data.userRealms.map((realm) => realm.realmId),
      searchingFor: realmId,
    });

    const company = data.userRealms.find((realm) => {
      const matches = realm.realmId === realmId;
      console.log(
        `Comparing realm ${realm.realmId} with target ${realmId}: ${matches}`
      );
      return matches;
    });

    if (!company) {
      console.log(
        'Available companies:',
        data.userRealms.map((realm) => ({
          realmId: realm.realmId,
          companyName: realm.companyName,
        }))
      );
      throw new Error(`Company with realmId ${realmId} not found`);
    }

    console.log(`Selecting company: ${company.companyName}`);
    const companyInput = await this.page.waitForSelector(
      CONFIG.selectors.companySelection.searchInput
    );
    await companyInput.click();
    await companyInput.fill(company.companyName);

    const options = this.page.locator(
      CONFIG.selectors.companySelection.listItem
    );
    await options.first().waitFor({ state: 'visible' });
    const count = await options.count();

    console.log(`Found ${count} matching companies`);
    await options.first().click();
  }
}
