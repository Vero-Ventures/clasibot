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