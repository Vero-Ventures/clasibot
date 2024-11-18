'use client';

import Link from 'next/link';

interface ManageAccountButtonProps {
  stripePortalUrl: string;
}

export const ManageAccountButton: React.FC<ManageAccountButtonProps> = ({
  stripePortalUrl,
}) => {
  return (
    <button>
      <Link
        className="flex min-w-52 transform items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-3 text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 lg:w-full lg:min-w-0"
        href={stripePortalUrl}>
        <span className="text-lg font-semibold md:text-2xl">
          Manage Account
        </span>
      </Link>
    </button>
  );
};
