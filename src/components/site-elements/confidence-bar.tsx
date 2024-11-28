'use client';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

// Define the Confidence Bar component to be displayed as a cell in the Review Page.
// Takes: The text to display in the Hover Card component and a Confidence Value between 0 and 3.
export function ConfidenceBar({
  confidence,
  hoverText,
}: Readonly<{
  confidence: number;
  hoverText: string;
}>) {
  // Define base Confidence Bar formatting for each segment.
  let segmentOneFormatting = 'z-0 w-8 h-6 m-1 ml-2 bg-gray-200 rounded-l-lg';
  let segmentTwoFormatting = 'z-0 w-8 h-6 m-1 bg-gray-200';
  let segmentThreeFormatting = 'z-0 w-8 h-6 m-1 mr-2 bg-gray-200 rounded-r-lg';

  // Update the number of highlighted segments based on the Confidence Value.
  if (confidence >= 1) {
    segmentOneFormatting = 'w-8 h-6 m-1 ml-2 bg-green-400 rounded-l-lg';
  }
  if (confidence >= 2) {
    segmentTwoFormatting = 'w-8 h-6 m-1 bg-green-400';
  }
  if (confidence >= 3) {
    segmentThreeFormatting = 'w-8 h-6 m-1 mr-2 bg-green-400 rounded-r-lg';
  }

  return (
    <div className="relative mx-auto flex w-fit">
      <HoverCard openDelay={150} closeDelay={150}>
        <HoverCardContent>{hoverText}</HoverCardContent>
        <div className="relative w-36">
          <HoverCardTrigger asChild>
            <div className="mx-2 flex w-fit rounded-lg border-3 border-gray-300 transition-all duration-300 hover:mb-11">
              <div className={segmentOneFormatting}></div>
              <div className={segmentTwoFormatting}></div>
              <div className={segmentThreeFormatting}></div>
            </div>
          </HoverCardTrigger>
        </div>
      </HoverCard>
    </div>
  );
}
