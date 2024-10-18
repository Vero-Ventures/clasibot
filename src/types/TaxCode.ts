/**
 * Defines a formatted version of a tax code object returned from the API.
 */

export type TaxCode = {
  // Identifier of the tax code, related to purchase tax code Id value.
  Id: string;
  // Systems name of the tax code.
  Name: string;
  // Automatically generate value or user entered description of the tax code.
  Description: string;
  // If the user has the tax code enabled.
  Active: boolean;
  // Indicates if more than one tax rates comprise the tax code.
  TaxGroup: boolean;
  // May contain more than one value, only if tax group is true.
  PurchaseTaxRateList: {
    // TaxRateDetail: Container for information about a tax rate inside the tax code.
    TaxRateDetail: [
      {
        // Reference to the tax rate for this index.
        //      Value: ID of the tax rate.
        //      Name: Name of the tax rate.
        TaxRateRef: { Value: string; Name: string };
        // Enum indicating how the tax is applied to the transaction.
        //      Values: TaxOnAmount, TaxOnAmountPlusTax, TaxOnTax
        TaxTypeApplicable: string;
        // Numerical value starting at 0 indicating order of taxes applied in ascending order.
        TaxOrder: number;
      },
    ];
  };
};
