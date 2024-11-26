export type QBOTokenData = {
  qboTicket: string;
  authId: string;
  nextSessionToken: string;
};

export type QBOFirmClientResponse = {
  errorMsg: string | null;
  userError: string | null;
  userRealms: Array<{
    realmId: string;
    companyName: string;
    active: boolean;
    firmId: string;
  }>;
};
