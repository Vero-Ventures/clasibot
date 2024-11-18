'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  SignOutButton,
  ChangeCompanyButton,
  DeactivationButton,
  ManageAccountButton,
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
    <div className="flex w-full flex-col items-center mb:flex-row mb:justify-evenly md:justify-evenly lg:gap-x-4">
      <div className={`mt-6 w-fit`}>
        <button
          className="mb-4 flex min-w-60 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-1 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 lg:w-full lg:min-w-0"
          onClick={() => setShowOptions(!showOptions)}>
          <span className="text-lg font-semibold">Options</span>
          <span className={`${showOptions ? '' : 'hidden'}`}>
            <ChevronUp className="ml-2 mt-1 h-6 w-6" />
          </span>
          <span className={`${showOptions ? 'hidden' : ''}`}>
            <ChevronDown className="ml-2 mt-1 h-6 w-6" />
          </span>
        </button>
      </div>
      <div
        className={`w-[272px] justify-center rounded-lg bg-gray-600 px-8 ${showOptions ? 'h-[236px] scale-y-100' : 'mt-0 h-0 scale-y-0'} origin-top transition-all duration-500 ease-in-out`}>
        <div className="flex flex-col">
          {/* Each button is animated with a staggered delay */}
          <div className="mt-4 w-fit">
            {showOptions && <ManageAccountButton stripePortalUrl={stripeUrl} />}
          </div>
          <div className="mt-6 w-fit">
            {showOptions && <ChangeCompanyButton />}
          </div>
          <div className="mb-4 mt-6 w-fit">
            {showOptions && (
              <DeactivationButton connectionStatus={connectionStatus} />
            )}
          </div>
        </div>
      </div>
      <div className={`mx-auto ${showOptions ? 'mt-4' : 'mt-2'} w-fit`}>
        <SignOutButton />
      </div>
    </div>
  );
}
