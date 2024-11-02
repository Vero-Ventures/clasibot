import { chromium } from 'playwright';
import { QuickBooksAuth } from './services/quickbooks/auth';
import { sendCookieToBackend } from './services/quickbooks/utils';

export async function syntheticAuth(
  realmId: string,
  firmName: string | null = null
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const auth = new QuickBooksAuth(context, page);
    const tokenData = await auth.authenticate(realmId, firmName);

    if (tokenData) {
      await sendCookieToBackend(
        tokenData,
        `${process.env.CLASIBOT_URL}/api/quickbooks/receive-qb-cookie`
      );
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

const realmId = process.env.TARGET_REALM_ID!;
const firmName = process.env.FIRM_NAME ?? null;

console.log(`Starting QuickBooks authentication for realmId: ${realmId}`);
if (firmName) {
  console.log(`Using firm name: ${firmName}`);
} else {
  console.log('Using default firm');
}

syntheticAuth(realmId, firmName);
