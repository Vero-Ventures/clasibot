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
        id="ManualReviewButton"
        className="h-12 w-40 self-center rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
        onClick={() => handleManualReview()}>
        Start Direct Review
      </Button>
    </div>
  );
}
