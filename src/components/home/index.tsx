'use client';
import { useState, useEffect } from 'react';
import ReviewPage from '@/components/home/review-page';
import {
  getCompanyName,
  getCompanyIndustry,
  getCompanyLocation,
} from '@/actions/quickbooks/user-info';
import { Locations } from '@/enums/taxes';
import type { CompanyInfo } from '@/types/CompanyInfo';

export default function HomePage() {
  // Create states to track and set the Company Info that is passed to the Review Page.
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    industry: '',
    location: { Country: '', SubLocation: null },
  });

  // Create states to prevent showing the review table until the page is loaded.
  const [finishedLoadingCompanyInfo, setFinishedLoadingCompanyInfo] =
    useState(true);

  // Gets the important Company Info and stores it as a Company Info object.
  const getCompanyInfo = async () => {
    const userCompanyName = await getCompanyName();
    const userCompanyIndustry = await getCompanyIndustry();
    const userCompanyLocation = JSON.parse(await getCompanyLocation());
    // Check if the Sub-Location is a valid Canadian location.
    if (
      Object.values(Locations).includes(
        userCompanyLocation.SubLocation as Locations
      )
    ) {
      // If the Sub-Location is valid, save it to the Company Info.
      setCompanyInfo({
        name: userCompanyName,
        industry: userCompanyIndustry,
        location: userCompanyLocation,
      });
    } else {
      // If it is not a Canadian locationm save the Company Info with the Sub-Location value set to null.
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

  // Use the useEffect hook to store Company Info on page load.
  useEffect(() => {
    getCompanyInfo();
  }, []);

  // Return the Review Page content.
  return (
    <div id="TableContainer" className="container mx-auto px-4 py-8">
      <ReviewPage
        company_info={companyInfo}
        found_company_info={finishedLoadingCompanyInfo}
      />
    </div>
  );
}
