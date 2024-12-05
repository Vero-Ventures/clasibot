export const CONFIG = {
  imap: {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT!),
    tls: true,
  },
  quickbooks: {
    loginUrl: process.env.LOGIN_URL!,
    email: process.env.QB_EMAIL_ADDRESS!,
    password: process.env.QB_PASSWORD!,
  },
  selectors: {
    login: {
      appSignInButton: 'button:has-text("Sign in with QuickBooks")',
      emailInput: '#iux-identifier-first-international-email-user-id-input',
      emailSubmit: '[data-testid="IdentifierFirstSubmitButton"]',
      passwordInput: '[data-testid="currentPasswordInput"]',
      passwordSubmit: '[data-testid="passwordVerificationContinueButton"]',
      mfaSMSOption: '[data-testid="challengePickerOption_SMS_OTP"]',
      verificationInput: '[data-testid="VerifyOtpInput"]',
      verificationSubmit: '[data-testid="VerifyOtpSubmitButton"]',
    },
    firmSelection: {
      searchInput:
        'input[role="combobox"][placeholder="Search for a company or firm"]',
      firmSearchInput: 'input[id="idsTxtField1"]',
      listItem: 'li[role="none"]',
      firmSelectionButtonInvite:
        'button[class="account-btn accountpicker-account-btn-quickbooks"]',
      firmSelectionButtonLogin:
        'button[class="account-btn account-btn-focus-quickbooks"]',
      firmAcceptButton: 'button[id="account-picker-continue-btn"]',
    },
    companySelection: {
      searchInput: 'input[role="combobox"][placeholder="Search for a client"]',
      listItem: 'li[role="none"]',
    },
  },
} as const;
