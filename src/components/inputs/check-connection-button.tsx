'use client';

import { useRouter } from 'next/navigation';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { MiniSpinner } from '@/components/loading-elements/index';

import { checkCompanyConnection } from '@/actions/backend-actions/database-functions/index';

export const CheckConnectionButton = () => {
  const router = useRouter();

  // Define states to track checking for connection, if a connection is found, and a possible failure message.
  const [checkingForSBK, setCheckingForSBK] = useState(false);
  const [sbkExists, setSbkExists] = useState<boolean | null>(null);
  const [displayFailMessage, setDisplayFailMessage] = useState<boolean>(false);

  // Helper function that checks for the connection, updates the states
  const handleCheckConnection = async () => {
    // Define the check process as started and get the connection value.
    setCheckingForSBK(true);
    const sbkCheck = await checkCompanyConnection();

    // Update the connection state and set the checking process to be complete.
    setSbkExists(sbkCheck.connected);
    setCheckingForSBK(false);

    if (sbkExists) {
      // Optional: Wait for the animation to complete before redirecting
      setTimeout(() => {
        router.push('/home');
      }, 2000);
    } else {
      // Display failure message and set timeout to reset check button.
      setDisplayFailMessage(true);
      setTimeout(() => {
        // Sets check to null and hides the error message.
        setSbkExists(null);
        setDisplayFailMessage(false);
      }, 3000);
    }
  };

  return (
    <>
      <Button
        className="w-full transform rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        onClick={handleCheckConnection}
        disabled={checkingForSBK}>
        Check Connection
      </Button>
      {(checkingForSBK || sbkExists !== null) && (
        <div className="mt-4">
          <MiniSpinner sbkExists={sbkExists} />
          {displayFailMessage && (
            <div className="text-md mt-4 text-center font-semibold mb:min-w-80 sm:text-lg">
              <p>Connection failed, please try again.</p>
              <p className="pb-1 pt-2">OR</p>
              <p>View troubleshooting solutions below.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};
