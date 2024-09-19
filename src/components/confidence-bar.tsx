'use client';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

// Define the ConfidenceBar component which takes a confidence value and a hoverText value.
export function ConfidenceBar({
  confidence,
  hoverText,
}: Readonly<{
  confidence: number;
  hoverText: string;
}>) {
  // Define base confidence bar formatting for each segment.
  let segmentOneFormatting = 'z-0 w-8 h-6 m-1 ml-2 bg-gray-200 rounded-l-lg';
  let segmentTwoFormatting = 'z-0 w-8 h-6 m-1 bg-gray-200';
  let segmentThreeFormatting = 'z-0 w-8 h-6 m-1 mr-2 bg-gray-200 rounded-r-lg';

  // Define the number filled confidence segments based on confidence value.
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
    // Define the confidence bar component container.
    <div className="relative flex w-fit">
      {/* Define the inner elements of the confidence bar using the defined segments and the Hover Card components. */}
      <HoverCard>
        <HoverCardContent>{hoverText}</HoverCardContent>
        <div className="relative h-8 w-36 -translate-y-0.5 pb-2">
          <HoverCardTrigger asChild>
            <div className="border-3 mx-2 flex w-fit rounded-lg border-blue-300 hover:mb-12">
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
