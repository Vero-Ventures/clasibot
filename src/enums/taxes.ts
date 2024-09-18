/**
 * Define static naming relevant for tax code identification
 */

// Defines standardized shorthand strings for Canada locations (provinces and territories).
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

// Defines a list of the current tax codes for Canada.
// Links typescript variable style names to full tax code names (same names for frontend and API).
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

// Defines a list of the current tax rates for Canada.
// Links typescript variable style names to full tax rate names.
export enum TaxRates {
  Exempt = 'GST EP',
  ZeroRated = 'GST/HST (ITC) ZR',
  OutOfScope = 'NOTAXP',
  GST = 'GST (ITC)',
  PstBC = 'PST (BC) Purchase',
  PstMB = 'PST (MB) on purchase',
  PstSk = 'PST (SK) 2017 on purchases',
  QstQC = 'QST 9.975 (ITR)',
  HstNS = 'HST (ITC) NS',
  HstON = 'HST (ITC) ON',
  HstNB = 'HST (ITC) NB 2016',
  HstNL = 'HST (NL) 2016',
  HstPE = 'HST (PE) 2016',
}

// Enum style dictionary that connects the tax code name to the tax rates that comprise that tax code.
// Uses the real QBO tax codes names for the keys which connect to arrays of the related API tax rate names.
export const TaxCodeRates = {
  Exempt: ['GST EP'],
  'Zero-rated': ['GST/HST (ITC) ZR'],
  'Out of Scope': ['NOTAXP'],
  GST: ['GST (ITC)'],
  'GST/PST BC': ['GST (ITC)', 'PST (BC) Purchase'],
  'PST BC': ['PST (BC) Purchase'],
  'GST/PST MB': ['GST (ITC)', 'PST (MB) on purchase'],
  'PST MB': ['PST (MB) on purchase'],
  'GST/PST SK': ['GST (ITC)', 'PST (SK) 2017 on purchases'],
  'PST SK': ['PST (SK) 2017 on purchases'],
  'GST/QST QC - 9.975': ['GST (ITC)', 'QST 9.975 (ITR)'],
  'QST QC - 9.975': ['QST 9.975 (ITR)'],
  'HST NS': ['HST (ITC) NS'],
  'HST ON': ['HST (ITC) ON'],
  'HST NB 2016': ['HST (ITC) NB 2016'],
  'HST NL 2016': ['HST (NL) 2016'],
  'HST PE 2016': ['HST (PE) 2016'],
};
