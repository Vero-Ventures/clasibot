import Imap from 'imap';

import { simpleParser } from 'mailparser';
import type { ParsedMail } from 'mailparser';

import type { Readable } from 'stream';

import { CONFIG } from '../config';

export class EmailService {
  private imap: Imap;

  constructor() {
    this.imap = new Imap(CONFIG.imap);
  }

  async fetchLatestEmail(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => this.handleImapReady(resolve, reject));
      this.imap.once('error', this.handleImapError(reject));
      this.imap.once('end', () => console.log('IMAP connection ended'));
      this.imap.connect();
    });
  }

  private handleImapReady(
    resolve: (code: string | null) => void,
    reject: (error: Error) => void
  ) {
    this.imap.openBox('INBOX', false, (err: Error | null) => {
      if (err) {
        this.imap.end();
        return reject(err);
      }
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      this.searchEmails(twoMinutesAgo, resolve, reject);
    });
  }

  private handleImapError(reject: (error: Error) => void) {
    return (err: Error) => {
      reject(err);
    };
  }

  private searchEmails(
    since: Date,
    resolve: (code: string | null) => void,
    reject: (error: Error) => void
  ) {
    this.imap.search(
      ['UNSEEN', ['SINCE', since]],
      (err: Error | null, results: number[]) => {
        if (err || results.length === 0) {
          this.imap.end();
          return err ? reject(err) : resolve(null);
        }
        this.fetchEmail(results[results.length - 1], resolve, reject);
      }
    );
  }

  private fetchEmail(
    emailId: number,
    resolve: (code: string | null) => void,
    reject: (error: Error) => void
  ) {
    const fetch = this.imap.fetch(emailId, { bodies: [''], markSeen: false });
    fetch.on('message', (msg: Imap.ImapMessage) => {
      msg.on('body', (stream: Readable) => {
        this.parseEmail(stream, resolve, reject);
      });
    });

    fetch.once('error', (err: Error) => {
      this.imap.end();
      reject(err);
    });
  }

  private parseEmail(
    stream: Readable,
    resolve: (code: string | null) => void,
    reject: (error: Error) => void
  ) {
    simpleParser(stream, (err: Error | null, parsed: ParsedMail) => {
      if (err) {
        this.imap.end();
        return reject(err);
      }

      let code: string | null = null;
      if (parsed.text) {
        const match = parsed.text.match(/\b\d{6}\b/);
        if (match) {
          code = match[0];
        }
      }

      this.imap.end();
      resolve(code);
    });
  }
}
