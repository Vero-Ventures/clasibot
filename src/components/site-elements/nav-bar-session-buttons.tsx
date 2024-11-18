'use client';

import { useState } from 'react';

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
    <div className="mb-2 flex flex-col mb:w-full mb:flex-row mb:justify-evenly md:justify-evenly lg:gap-x-4">
      <div className={`mt-6 w-fit`}>
        <button
          className="flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 lg:w-full lg:min-w-0"
          onClick={() => setShowOptions(!showOptions)}>
          <span className="text-lg font-semibold">Options</span>
        </button>
      </div>
      <div className={`mt-6 w-fit ${showOptions ? '' : 'hidden'}`}>
        <ManageAccountButton stripePortalUrl={stripeUrl} />
      </div>
      <div className={`mt-6 w-fit ${showOptions ? '' : 'hidden'}`}>
        <ChangeCompanyButton />
      </div>
      <div className={`mt-6 w-fit ${showOptions ? '' : 'hidden'}`}>
        <DeactivationButton connectionStatus={connectionStatus} />
      </div>
      <div className={`mt-6 w-fit`}>
        <SignOutButton />
      </div>
    </div>
  );
}
