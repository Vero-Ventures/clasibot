'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  SignOutButton,
  ChangeCompanyButton,
  DeactivationButton,
  ManageSubscriptionButton,
} from '@/components/inputs/index';

export function NavBarSesssionButtons({
  connectionStatus,
  stripeUrl,
}: Readonly<{
  connectionStatus: boolean;
  stripeUrl: string;
}>) {
  // Define state to show additional NavBar options on smaller screens.
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="flex w-full flex-col items-center mb:flex-row mb:items-start mb:justify-evenly mb:pr-14 md:justify-evenly md:pr-0">
      <div className="flex flex-col items-center md:hidden">
        <button
          className="mb-4 mt-6 flex w-fit min-w-48 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:mt-8 md:hidden"
          onClick={() => setShowOptions(!showOptions)}>
          <span className="mr-2 text-lg font-semibold">Options</span>
          <span className={`${showOptions ? '' : 'hidden'}`}>
            <ChevronUp className="mt-1 h-6 w-6" />
          </span>
          <span className={`${showOptions ? 'hidden' : ''}`}>
            <ChevronDown className="mt-1 h-6 w-6" />
          </span>
        </button>

        <div
          className={`w-[272px] justify-center rounded-lg bg-gray-600 px-8 ${showOptions ? 'h-[212px] scale-y-100' : 'h-0 scale-y-0'} origin-top overflow-hidden transition-all duration-500 ease-out`}>
          <div className="mt-4 flex flex-col gap-y-6">
            {/* Each button is animated with a staggered delay */}
            <div
              className={`w-fit ${showOptions ? 'scale-y-100' : 'scale-y-0'} `}>
              <ManageSubscriptionButton stripePortalUrl={stripeUrl} />
            </div>
            <div
              className={`w-fit ${showOptions ? 'scale-y-100' : 'scale-y-0'} `}>
              <DeactivationButton connectionStatus={connectionStatus} />
            </div>
            <div
              className={`w-fit ${showOptions ? 'scale-y-100' : 'scale-y-0'} `}>
              <ChangeCompanyButton />
            </div>
          </div>
        </div>
      </div>
      <div className={`hidden md:mt-6 md:block`}>
        <ManageSubscriptionButton stripePortalUrl={stripeUrl} />
      </div>
      <div className={`hidden pl-4 pr-2 md:mt-6 md:block`}>
        <DeactivationButton connectionStatus={connectionStatus} />
      </div>
      <div className={`hidden pl-2 pr-4 md:mt-6 md:block`}>
        <ChangeCompanyButton />
      </div>
      <div
        className={` ${showOptions ? 'mt-4' : 'mt-2'} w-fit mb:mt-7 md:mt-6`}>
        <SignOutButton />
      </div>
    </div>
  );
}
