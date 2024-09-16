/**
 * Defines a formatted version of a tax rate returned from the API.
 */

export type TaxRate = {
  // Id: The ID of that that rate.
  Id: string;
  // Name: The name of the tax rate in QBO.
  Name: string;
  // Description: A short description of the tax rate that the user may enter, otherwise automatically generated.
  Description: string;
  // Active: Indicates that the user has that tax rate active in the company.
  Active: boolean;
  // RateValue: The rate (percentage) that this rate taxes at.
  //    May be missing for certain options from API, this is not the same as being 0.
  //    Only rated tax rates matter and should be recorded.
  RateValue: number;
  // Indicates if tax rate is shown in certain areas. Optional value, may not be present.
  //    Badly documented, unclear what values mean and how to intepret them.
  //    Relevant tax rates 'excempt' and 'out-of-scope' include this parameter.
  DisplayType: string;
};
