'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import {
  ChangeCompanyButton,
  DeactivationButton,
  MobileDeactivationButton,
  ManageSubscriptionButton,
  SignOutButton,
} from '@/components/inputs/index';

// Takes: The current connection status and the url for the Stripe subscription managment page.
export function NavBarSesssionButtons({
  connectionStatus,
  stripeUrl,
}: Readonly<{
  connectionStatus: boolean;
  stripeUrl: string;
}>) {
  // Define states used to show NavBar options dropdown used for smaller screens.
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showMobileDeactivateModal, setShowMobileDeactivateModal] =
    useState(false);

  // Define states to track which deactivation modals should be displayed to the user (if any).
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-center mb:flex-row mb:items-start mb:justify-evenly mb:pr-14 md:justify-evenly md:pr-0">
      <div className="flex flex-col items-center md:hidden">
        <button
          className="mb-4 mt-6 flex w-fit min-w-48 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1 text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mb:mt-8 md:hidden"
          onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}>
          <span className="mr-2 text-lg font-semibold">Options</span>
          <span className={`${showOptionsDropdown ? '' : 'hidden'}`}>
            <ChevronUp className="mt-1 h-6 w-6" />
          </span>
          <span className={`${showOptionsDropdown ? 'hidden' : ''}`}>
            <ChevronDown className="mt-1 h-6 w-6" />
          </span>
        </button>

        <div
          className={`w-[272px] justify-center rounded-lg bg-gray-600 px-8 ${showOptionsDropdown ? 'h-[212px] scale-y-100' : 'h-0 scale-y-0'} origin-top overflow-hidden transition-all duration-500 ease-out`}>
          <div className="mt-4 flex flex-col gap-y-6">
            <div
              className={`w-fit ${showOptionsDropdown ? 'scale-y-100' : 'scale-y-0'} `}>
              <ManageSubscriptionButton stripePortalUrl={stripeUrl} />
            </div>
            <div
              className={`w-fit ${showOptionsDropdown ? 'scale-y-100' : 'scale-y-0'} `}>
              <button
                onClick={() => {
                  setShowMobileDeactivateModal(true);
                  setInfoModalOpen(true);
                }}
                className="flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-2 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
                Remove Connection
              </button>
            </div>
            <div
              className={`w-fit ${showOptionsDropdown ? 'scale-y-100' : 'scale-y-0'} `}>
              <ChangeCompanyButton />
            </div>
          </div>
        </div>
      </div>

      <div className={`${showMobileDeactivateModal ? 'md:hidden' : 'hidden'}`}>
        <MobileDeactivationButton
          setShowModal={setShowMobileDeactivateModal}
          infoModalOpen={infoModalOpen}
          confirmModalOpen={confirmModalOpen}
          errorModalOpen={errorModalOpen}
          setInfoModalOpen={setInfoModalOpen}
          setConfirmModalOpen={setConfirmModalOpen}
          setErrorModalOpen={setErrorModalOpen}
        />
      </div>

      <div className={`hidden md:mt-6 md:block`}>
        <ManageSubscriptionButton stripePortalUrl={stripeUrl} />
      </div>

      <div className={`hidden pl-4 pr-2 md:mt-6 md:block`}>
        <DeactivationButton
          setShowModal={setShowMobileDeactivateModal}
          connectionStatus={connectionStatus}
          infoModalOpen={infoModalOpen}
          confirmModalOpen={confirmModalOpen}
          errorModalOpen={errorModalOpen}
          setInfoModalOpen={setInfoModalOpen}
          setConfirmModalOpen={setConfirmModalOpen}
          setErrorModalOpen={setErrorModalOpen}
        />
      </div>

      <div className={`hidden pl-2 pr-4 md:mt-6 md:block`}>
        <ChangeCompanyButton />
      </div>

      <div
        className={` ${showOptionsDropdown ? 'mt-4' : 'mt-2'} w-fit mb:mt-7 md:mt-6`}>
        <SignOutButton />
      </div>
    </div>
  );
}
