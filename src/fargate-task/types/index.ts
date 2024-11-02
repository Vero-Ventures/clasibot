export type QBOTokenData = {
  qbnTkt: string;
  qbnAuthId: string;
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
