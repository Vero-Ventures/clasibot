/**
 * Defines a formatted version of a tax code returned from the API.
 */

export type TaxCode = {
  // Id: Identifier of the tax code, related to purchase tax code Id value.
  Id: string;
  // Name: Systems name of the tax code.
  Name: string;
  // Description: Automatic or user entered description of the tax code.
  Description: string;
  // Active: If the user has the tax code enabled.
  Active: boolean;
  // TaxGroup: Indicates if more than one tax rates comprise the tax code.
  TaxGroup: boolean;
  // SalesTaxRateList: An array of taxes that compose the tax code.
  // May contain more than one value, only if tax group is true.
  PurchaseTaxRateList: {
    // TaxRateDetail: Container for information about a tax rate inside the tax code.
    TaxRateDetail: [
      // TaxRateRef: Reference to the tax rate for this index.
      //      Value: ID of the tax rate.
      //      Name: Name of the tax rate.
      {
        TaxRateRef: { Value: string; Name: string };
        // TaxTypeApplicable: Enum indicating how the tax is applied to the transaction.
        //      Values: TaxOnAmount, TaxOnAmountPlusTax, TaxOnTax
        TaxTypeApplicable: string;
        // TaxOrder: Numerical value starting at 0 indicating order of taxes applied in ascending order.
        TaxOrder: number;
      },
    ];
  };
};
