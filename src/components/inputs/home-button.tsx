'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function HomeButton() {
  return (
    <Button asChild className="my-2">
      <Link href="/">Go Back Home</Link>
    </Button>
  );
}
