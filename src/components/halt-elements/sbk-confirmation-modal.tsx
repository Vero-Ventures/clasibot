'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MiniSpinner from '../mini-spinner';
import { useEffect, useState } from 'react';
import HomePage from '../home';

const functionToCheckIfSBKExists = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random() > 0.9); // Simulate the SBK being connected randomly.
    }, 1000);
  });
};

// Define the props type
interface SBKConfirmationModalProps {
  companyHasSBK: boolean;
}

const SBKConfirmationModal: React.FC<SBKConfirmationModalProps> = ({
  companyHasSBK: initialCompanyHasSBK,
}) => {
  const [companyHasSBK, setCompanyHasSBK] =
    useState<boolean>(initialCompanyHasSBK);

    useEffect(() => {
      if (companyHasSBK) return;

      const intervalId = setInterval(async () => {
        // Simulate fetching from a client-side function (must be async)
        const sbkExists = await functionToCheckIfSBKExists(); // This would be a client-side function like fetch or axios call
        if (sbkExists) {
          setCompanyHasSBK(true);
          clearInterval(intervalId); // Stop polling when condition is met
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }, [companyHasSBK]);

    if (companyHasSBK) {
      return <HomePage />;
    }

  return (
    <div
      className={`fixed left-0 top-0 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50`}>
      <div className="mx-4 flex w-96 flex-col space-y-4 rounded-lg bg-white p-6">
        <h2
          id="ResultTitle"
          className="text-center text-2xl font-bold text-red-500">
          Unable to Proceed
        </h2>

        <p id="ResultMessage" className="text-center font-medium text-gray-800">
          Clasibot hasn&apos;t been added to your company yet, so you can&apos;t
          proceed.
        </p>
        <p id="ResultMessage" className="text-center font-medium text-gray-800">
          If you&apos;ve already followed the instructions to add Clasibot,
          please wait—we&apos;re confirming in the background, and the screen
          will update automatically once it&apos;s done.
        </p>
        <MiniSpinner />
        <p
          id="ResultMessage"
          className="mb-6 text-center font-medium text-gray-800">
          If you haven&apos;t added Clasibot, click &apos;Go to
          Instructions&apos; below. Clasibot needs access to your QuickBooks
          transactions to function properly.
        </p>
        <div className="flex items-center justify-center">
          <Link
            id="AddSBKInstructionsPageLink"
            href="/add-sbk-instructions"
            className="inline-block">
            <Button>Go To Instructions</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SBKConfirmationModal;