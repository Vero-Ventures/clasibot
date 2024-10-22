'use client';
import { useState, useEffect } from 'react';
import {
  getCompanyName,
  getCompanyIndustry,
  getCompanyLocation,
} from '@/actions/quickbooks/user-info';
import ReviewPage from '@/components/home/review-page';
import type { CompanyInfo } from '@/types/CompanyInfo';
import { Locations } from '@/enums/taxes';

export default function HomePage() {
  // Create states to track and set the important values.
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    industry: '',
    location: { Country: '', SubLocation: null },
  });

  // Define states to prevent showing the table until the page is loaded.
  const [finishedLoadingCompanyInfo, setFinishedLoadingCompanyInfo] =
    useState(true);

  // Gets the important company info and stores it as one object.
  // *** NOTE: Presently does not update industry, update in future. ***
  const getCompanyInfo = async () => {
    const userCompanyName = await getCompanyName();
    const userCompanyIndustry = await getCompanyIndustry();
    const userCompanyLocation = JSON.parse(await getCompanyLocation());
    // Check if the sub-location is a valid Canada location.
    if (
      Object.values(Locations).includes(
        userCompanyLocation.SubLocation as Locations
      )
    ) {
      // If the sub location is a valid canada location, save it to the company info.
      setCompanyInfo({
        name: userCompanyName,
        industry: userCompanyIndustry,
        location: userCompanyLocation,
      });
    } else {
      // Otherwise save the company info with the location:Location value set to null.
      setCompanyInfo({
        name: userCompanyName,
        industry: userCompanyIndustry,
        location: {
          Country: userCompanyLocation.SubLocation,
          SubLocation: null,
        },
      });
    }
    setFinishedLoadingCompanyInfo(true);
  };

  // Use the useEffect hook to call the setup methods on page load.
  useEffect(() => {
    // Get the users the company info.
    getCompanyInfo();
  }, []);

  // Return the base homepage content and determine which table should be displayed.
  return (
    <div id="TableContainer" className="container mx-auto px-4 py-8">
      <ReviewPage
        company_info={companyInfo}
        found_company_info={finishedLoadingCompanyInfo}
      />
    </div>
  );
}
