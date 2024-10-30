/**
 * Defines a formatted version of a Tax Code object returned from the API.
 */

export type TaxCode = {
  // Identifier of the Tax Code, same as the Tax Code Id value in a Purchase.
  Id: string;
  // QuickBooks internal name of the Tax Code.
  Name: string;
  // If the User has the Tax Code enabled.
  Active: boolean;
};
