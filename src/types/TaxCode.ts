/**
 * Defines a formatted version of a Tax Code object returned from the API.
 */

export type TaxCode = {
  // Identifier of the Tax Code, same as the Tax Code Id value in a Purchase object.
  Id: string;
  // Internal QuickBooks name of the Tax Code.
  Name: string;
  // If user has the Tax Code enabled.
  Active: boolean;
};
