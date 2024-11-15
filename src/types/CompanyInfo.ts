/**
 * Tracks the important info from the User Company in a single object.
 */
import type { Locations } from '@/enums/taxes';

export type CompanyInfo = {
  // The Company name. On failure, saved as 'Error: Name not found'.
  name: string;
  // The industry the Company operates in.
  // Saved as 'None' if not present.
  // On failure, saved as 'Error'.
  industry: string;
  // Contains the country and sub location of the country the Company is located in.
  location: {
    // Can either be full name capitalized, 3 Letter Standard abbreviations, or other such as 'CA'.
    Country: string;
    // For CA country, should always be one of the values defined in the Locations Enum in the Taxes.ts file.
    // Otherwise the values is set to null.
    SubLocation: Locations | null;
  };
};
