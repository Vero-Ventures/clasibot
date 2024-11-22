'use client';

import { Button } from '@/components/ui/button';

export function ManualReviewButton({
  handleManualReview,
}: Readonly<{
  handleManualReview: () => void;
}>) {
  return (
    <div className="mx-auto w-fit">
      <Button
        className="self-center rounded bg-blue-500 px-8 py-6 text-lg font-bold text-white hover:bg-blue-600 sm:text-xl sm:px-12 sm:py-7"
        onClick={() => handleManualReview()}>
        Start Review
      </Button>
    </div>
  );
}
