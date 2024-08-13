'use client';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';

// Define the ConfidenceBar component which takes confidence and hoverText values.
export function ConfidenceBar({
  confidence,
  hoverText,
}: Readonly<{
  confidence: number;
  hoverText: string;
}>) {
  return (
    // Define the confidence bar component container.
    <div className="relative flex w-fit">
      <div className="w-36 h-8 py-2">
        {/* Define the inner elements of the confidence bar using the Progress and Hover Card components. */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <Progress value={confidence} />
          </HoverCardTrigger>
          <HoverCardContent>{hoverText}</HoverCardContent>
        </HoverCard>
      </div>
    </div>
  );
}
