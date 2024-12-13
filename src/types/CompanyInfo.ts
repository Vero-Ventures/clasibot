/**
 * Tracks the important info from the User Company in a single object.
 */
import type { Locations } from '@/enums/tax-codes';

export type CompanyInfo = {
  // The internal QuickBooks Company Name.
  // On failure: saved as 'Error: Name not found'.
  name: string;
  // The Industry the Company operates in, saved as 'None' if not present.
  // On failure: saved as 'Error'.
  industry: string;
  // Contains the country and Sub-Locations of the country the Company is located in.
  location: {
    // Can either be full name capitalized, 3 Letter Standard abbreviations, or other such as 'CA'.
    // On failure: value is set to an empty string.
    Country: string;
    // For CA country, should always be one of the values defined in the Locations Enum in the tax-codes.ts file.
    // On failure or if the value is not in the Enum file: value is set to null.
    SubLocation: Locations | null;
  };
};
