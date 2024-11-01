'use client';

import MiniSpinner from '../mini-spinner';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SBKConfirmationModal = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/add-sbk-instructions');
    }, 4000);

    return () => clearTimeout(timer);
  });

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
        <MiniSpinner sbkExists={false} />
      </div>
    </div>
  );
};

export default SBKConfirmationModal;
