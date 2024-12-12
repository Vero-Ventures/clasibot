export const CONFIG = {
  imap: {
    user: process.env.EMAIL_USER!,
    password: process.env.EMAIL_PASSWORD!,
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT!),
    tls: true,
  },
  myMfa: {
    numberId: process.env.MFA_NUMBER_ID,
    mfaApiKey: process.env.MFA_API_KEY,
  },
  quickbooks: {
    loginUrl: process.env.LOGIN_URL!,
    email: process.env.QB_EMAIL_ADDRESS!,
    password: process.env.QB_PASSWORD!,
  },
  selectors: {
    login: {
      emailInput: '#iux-identifier-first-international-email-user-id-input',
      emailSubmit: '[data-testid="IdentifierFirstSubmitButton"]',
      passwordInput: '[data-testid="currentPasswordInput"]',
      passwordSubmit: '[data-testid="passwordVerificationContinueButton"]',
      mfaSMSOption: '[data-testid="challengePickerOption_SMS_OTP"]',
      mfaInput: '[data-testid="VerifyOtpInput"]',
      mfaSubmit: '[data-testid="VerifyOtpSubmitButton"]',
    },
    firmSelection: {
      searchInput: 'input[type="text"]',
      firmSelectionButtonLogin: 'button[class~="account-btn"]',
      firmSelectionButtonInvite:
        'button[class="account-btn accountpicker-account-btn-quickbooks"]',

      firmSelectionAcceptButton: 'button[id="account-picker-continue-btn"]',
    },
  },
} as const;
