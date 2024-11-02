export const CONFIG = {
  imap: {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT!),
    tls: true,
  },
  quickbooks: {
    email: process.env.QB_EMAIL_ADDRESS!,
    password: process.env.QB_PASSWORD!,
    baseUrl: process.env.CLASIBOT_URL!,
  },
  selectors: {
    login: {
      appSignInButton: '#QuickBooksSignIn',
      emailInput: '#iux-identifier-first-international-email-user-id-input',
      emailSubmit: '[data-testid="IdentifierFirstSubmitButton"]',
      passwordInput: '#iux-password-confirmation-password',
      passwordSubmit: '[data-testid="passwordVerificationContinueButton"]',
      mfaEmailOption: '[data-testid="challengePickerOption_EMAIL_OTP"]',
      verificationInput: '[data-testid="VerifyOtpInput"]',
      verificationSubmit: '[data-testid="VerifyOtpSubmitButton"]',
    },
    firmSelection: {
      searchInput:
        'input[role="combobox"][placeholder="Search for a company or firm"]',
      listItem: 'li[role="none"]',
    },
    companySelection: {
      searchInput: 'input[role="combobox"][placeholder="Search for a client"]',
      listItem: 'li[role="none"]',
    },
  },
} as const;
