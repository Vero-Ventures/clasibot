import { chromium } from 'playwright';
import type { Browser, Page, BrowserContext } from 'playwright';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import type { ParsedMail } from 'mailparser';
import type { Readable } from 'stream';
import { JSDOM } from 'jsdom';

interface TokenData {
  companyId: string;
  tokenValue: string;
  expiresAt: number;
}

const imapConfig: Imap.Config = {
  user: process.env.EMAIL_USER ?? '',
  password: process.env.EMAIL_PASSWORD ?? '',
  host: process.env.IMAP_HOST ?? 'imap.gmail.com',
  port: parseInt(process.env.IMAP_PORT ?? '993', 10),
  tls: true,
};

const qbEmail = process.env.QB_EMAIL_ADDRESS ?? '';
const qbPassword = process.env.QB_PASSWORD ?? '';

if (!imapConfig.user || !imapConfig.password) {
  throw new Error(
    'EMAIL_USER and EMAIL_PASSWORD must be set in environment variables'
  );
}

function extractCodeFromHtml(html: string): string | null {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const codeParagraph = Array.from(document.querySelectorAll('p')).find((p) =>
    p.textContent?.trim().match(/^\d{6}$/)
  );

  if (codeParagraph) {
    return codeParagraph.textContent?.trim() ?? null;
  }

  return null;
}

function fetchLatestEmail(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      console.log('IMAP connection ready');
      imap.openBox('INBOX', false, (err: Error | null) => {
        if (err) {
          console.error('Error opening inbox:', err);
          imap.end();
          return reject(err);
        }
        console.log('Inbox opened');

        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        console.log('Searching for emails since:', twoMinutesAgo.toISOString());
        imap.search(
          ['UNSEEN', ['SINCE', twoMinutesAgo]],
          (err: Error | null, results: number[]) => {
            if (err) {
              console.error('Error searching emails:', err);
              imap.end();
              return reject(err);
            }

            console.log('Search results:', results);
            if (results.length === 0) {
              console.log('No new emails found');
              imap.end();
              return resolve(null);
            }

            const latestEmail = results[results.length - 1];
            console.log('Fetching the most recent email:', latestEmail);

            const fetch = imap.fetch(latestEmail, {
              bodies: [''],
              markSeen: false,
            });

            fetch.on('message', (msg: Imap.ImapMessage) => {
              console.log('Processing message');

              msg.on('body', (stream: Readable) => {
                simpleParser(
                  stream,
                  (err: Error | null, parsed: ParsedMail) => {
                    if (err) {
                      console.error('Error parsing email:', err);
                      imap.end();
                      return reject(err);
                    }
                    console.log('Email parsed');

                    let code: string | null = null;
                    if (parsed.html) {
                      code = extractCodeFromHtml(parsed.html);
                    } else if (parsed.text) {
                      code = extractCodeFromHtml(`<p>${parsed.text}</p>`);
                    }

                    if (code) {
                      console.log('Code found:', code);
                      imap.end();
                      resolve(code);
                    } else {
                      console.log('No code found in this email');
                      imap.end();
                      resolve(null);
                    }
                  }
                );
              });
            });

            fetch.once('error', (err: Error) => {
              console.error('Fetch error:', err);
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              console.log('Fetch ended');
            });
          }
        );
      });
    });

    imap.once('error', (err: Error) => {
      console.error('IMAP connection error:', err);
      reject(err);
    });

    imap.once('end', () => {
      console.log('IMAP connection ended');
    });

    console.log('Connecting to IMAP server');
    imap.connect();
  });
}

async function waitForCode(
  maxAttempts: number = 10,
  delayBetweenAttempts: number = 5000
): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 10000));

  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Attempt ${i + 1} to fetch code...`);
    try {
      const code = await fetchLatestEmail();
      if (code) return code;
    } catch (error) {
      console.error(`Error during attempt ${i + 1}:`, error);
    }
    if (i < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts));
    }
  }
  return null;
}

async function sendCookieToBackend(tokenData: TokenData, backendUrl: string) {
  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.BACKEND_AGENT_ID!,
      },
      body: JSON.stringify(tokenData),
    });

    if (response.ok) {
      console.log('Cookie successfully sent to backend');
    } else {
      console.error('Failed to send cookie to backend:', await response.text());
    }
  } catch (error) {
    console.error('Error sending cookie to backend:', error);
  }
}

export async function syntheticAuth(companyId: string) {
  const browser: Browser = await chromium.launch({ headless: true });
  const context: BrowserContext = await browser.newContext();
  const page: Page = await context.newPage();

  try {
    const targetUrl = 'http://localhost:3000';
    console.log(`Navigating to: ${targetUrl}`);
    await page.goto(targetUrl);

    await page.waitForSelector('#QuickBooksSignInButton', { state: 'visible' });
    await page.click('#QuickBooksSignInButton');

    // Enter and submit email address
    await page.waitForSelector(
      '#iux-identifier-first-international-email-user-id-input',
      { state: 'visible' }
    );
    await page.fill(
      '#iux-identifier-first-international-email-user-id-input',
      qbEmail
    );
    await page.click('[data-testid="IdentifierFirstSubmitButton"]');

    // Enter and submit password
    await page.waitForSelector('#iux-password-confirmation-password', {
      state: 'visible',
    });
    await page.fill('#iux-password-confirmation-password', qbPassword);
    await page.click(`[data-testid="passwordVerificationContinueButton"]`);

    // Select email option for MFA process
    await page.waitForSelector(
      `[data-testid="challengePickerOption_EMAIL_OTP"]`,
      { state: 'visible' }
    );
    await page.click(`[data-testid="challengePickerOption_EMAIL_OTP"]`);

    console.log('Waiting for verification code...');
    const code = await waitForCode();

    if (code) {
      console.log('Code retrieved:', code);
      await page.waitForSelector(`[data-testid="VerifyOtpInput"]`, {
        state: 'visible',
      });
      await page.fill(`[data-testid="VerifyOtpInput"]`, code);
      await page.click(`[data-testid="VerifyOtpSubmitButton"]`);
      console.log('Verification code submitted');
      await page.waitForSelector(`[data-testid="SelectAccountOptionButton-0"]`);
      await page.click(`[data-testid="SelectAccountOptionButton-0"]`);
      console.log('Successfully logged in to QuickBooks');

      await page.waitForTimeout(5000);

      const cookies = await context.cookies();

      const qbnTktCookie = cookies.find((cookie) => cookie.name === 'qbn.tkt');

      if (qbnTktCookie) {
        console.log('qbn.tkt cookie found');
        console.log('Cookie details:', {
          name: qbnTktCookie.name,
          value: qbnTktCookie.value,
          domain: qbnTktCookie.domain,
          path: qbnTktCookie.path,
          expires: qbnTktCookie.expires,
          httpOnly: qbnTktCookie.httpOnly,
          secure: qbnTktCookie.secure,
          sameSite: qbnTktCookie.sameSite,
        });

        const result: TokenData = {
          companyId,
          tokenValue: qbnTktCookie.value,
          expiresAt: qbnTktCookie.expires,
        };

        await sendCookieToBackend(
          result,
          `${targetUrl}/api/quickbooks/internal-cookie`
        );
      } else {
        console.error('qbn.tkt cookie not found');
        console.log(
          'Available cookie names:',
          cookies.map((cookie) => cookie.name)
        );
      }
    } else {
      console.error(
        'Failed to retrieve code from email after multiple attempts'
      );
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await browser.close();
  }
}
