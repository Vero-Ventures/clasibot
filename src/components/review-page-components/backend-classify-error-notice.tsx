'use client';

import { Button } from '@/components/ui/button';

export function BackendClassifyErrorNotice({
  showErrorNotice,
  dismissErrorStatus,
}: Readonly<{
  showErrorNotice: boolean;
  dismissErrorStatus: () => void;
}>) {
  return (
    <div
      className={`${showErrorNotice ? '' : 'hidden'} mx-2 mb-12 mt-8 flex w-fit max-w-lg transform flex-col overflow-auto rounded-lg border-4 border-red-500 border-opacity-60 bg-white p-6 py-4 shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl mb:mx-8 mb:px-8`}>
      <div className="text-center">
        <p className="pb-2 text-2xl font-bold text-red-500 mb:text-3xl">
          Notice:
        </p>
        <p className="text-lg font-semibold text-red-600 mb:text-xl">
          <span className="block mb:inline-block">
            An Error Occured During&nbsp;
          </span>
          <span className="block mb:inline-block">Last Auto-Review</span>
        </p>
        <p className="py-4 text-base italic mb:px-2 mb:text-lg">
          <span className="inline-block">
            Run a direct review to get up to date&nbsp;
          </span>
          <span className="inline-block">
            transactions and classifications.
          </span>
        </p>
      </div>
      <div className="mt-2 flex justify-evenly">
        <Button
          onClick={() => dismissErrorStatus()}
          className="transform rounded-lg bg-gradient-to-r from-red-500 to-red-700 px-8 py-4 text-lg font-semibold text-white shadow-md transition-transform duration-300 ease-in-out hover:scale-105 hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 mb:py-6 mb:text-xl sm:py-6 sm:text-2xl">
          Dismiss
        </Button>
      </div>
    </div>
  );
}