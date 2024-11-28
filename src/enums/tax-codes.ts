/**
 * Define static strings relevant for Tax Code identification.
 */

// Defines standardized 2-letter shorthand strings for Canadian locations (provinces and territories).
//    Should be used by QuickBooks for in Canada Company locations.
//    Used to identify the Tax Codes that may apply to a Company's Transactions.
export enum Locations {
  AB = 'AB',
  BC = 'BC',
  MB = 'MB',
  NB = 'NB',
  NL = 'NL',
  NS = 'NS',
  NU = 'NU',
  NW = 'NW',
  ON = 'ON',
  PE = 'PE',
  QC = 'QC',
  SK = 'SK',
  YT = 'YT',
}

// Defines a list of the current Tax Codes for Canada.
//    QuickBooks Tax Codes use the same names for frontend and backend.
export enum TaxCodes {
  Exempt = 'Exempt',
  ZeroRated = 'Zero-rated',
  OutOfScope = 'Out of Scope',
  Gst = 'GST',
  GstPstBC = 'GST/PST BC',
  PstBC = 'PST BC',
  GstPstMB = 'GST/PST MB',
  PstMB = 'PST MB',
  GstPstSK = 'GST/PST SK',
  PstSk = 'PST SK',
  GstQstQC = 'GST/QST QC - 9.975',
  QstQC = 'QST QC - 9.975',
  HstNS = 'HST NS',
  HstON = 'HST ON',
  HstNB = 'HST NB 2016',
  HstNL = 'HST NL 2016',
  HstPE = 'HST PE 2016',
}

// Use record to allow easy identification of relevant Tax Codes by location.
export const LocationsToTaxCodes: Record<string, string[]> = {
  Canada: [
    TaxCodes.Exempt,
    TaxCodes.ZeroRated,
    TaxCodes.OutOfScope,
    TaxCodes.Gst,
  ],
  BC: [TaxCodes.GstPstBC, TaxCodes.PstBC],
  MB: [TaxCodes.GstPstMB, TaxCodes.PstMB],
  SK: [TaxCodes.GstPstSK, TaxCodes.PstSk],
  QC: [TaxCodes.GstQstQC, TaxCodes.QstQC],
  NS: [TaxCodes.HstNS],
  ON: [TaxCodes.HstON],
  NB: [TaxCodes.HstNB],
  NL: [TaxCodes.HstNL],
  PE: [TaxCodes.HstPE],
};
