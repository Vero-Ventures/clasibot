'use client';

import { Button } from '@/components/ui/button';

export function ReviewButton({
  handleReview,
}: Readonly<{
  handleReview: () => void;
}>) {
  return (
    <div className="mx-auto w-fit">
      <Button
        className="self-center rounded bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 text-lg font-bold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 sm:px-12 sm:py-7 sm:text-xl"
        onClick={() => handleReview()}>
        Start Review
      </Button>
    </div>
  );
}
