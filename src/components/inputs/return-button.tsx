'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function ReturnButton() {
  return (
    <Button asChild className="my-2">
      <Link href="/">Return</Link>
    </Button>
  );
}
