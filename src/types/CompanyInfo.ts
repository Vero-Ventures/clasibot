/**
 * Tracks the important info from the user company in a single object.
 */

import type { Locations } from '@/enums/taxes';

export type CompanyInfo = {
  // The company name. On failure, saved as 'Error: Name not found'.
  name: string;
  // The industry the company operates in. Saved as 'None' if not present / set by user.
  // On failure, saved as 'Error'.
  industry: string;
  // Contains the country and sub location of the country the company is located in.
  location: {
    // Can either be full name capitalized, 3 Letter Standard abbreviations, or other such as 'CA'.
    Country: string;
    // For CA country, should always be one of the values defined in the Locations Enum in the Taxes.ts file.
    // Otherwise the values is set to null.
    Location: Locations | null;
  };
};
