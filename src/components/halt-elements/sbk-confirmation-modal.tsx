'use client';

import MiniSpinner from '../mini-spinner';
import { useEffect } from 'react';
import HomePage from '../home';
import { useRouter } from 'next/navigation';

// Define the props type
interface SBKConfirmationModalProps {
  companyHasSBK: boolean;
}

const SBKConfirmationModal: React.FC<SBKConfirmationModalProps> = ({
  companyHasSBK: initialCompanyHasSBK,
}) => {

  const router = useRouter();

  useEffect(() => {
    if (initialCompanyHasSBK) return;
    const timer = setTimeout(() => {
      router.push('/add-sbk-instructions');
    }, 4000);

    return () => clearTimeout(timer);
  });

  if (initialCompanyHasSBK) {
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
          You are being redirected to the instructions now...
        </p>
        <MiniSpinner />
      </div>
    </div>
  );
};

export default SBKConfirmationModal;