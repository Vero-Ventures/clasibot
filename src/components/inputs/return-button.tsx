'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function ReturnButton() {
  return (
    <Button
      asChild
      className="my-2 bg-gray-500 font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-600">
      <Link href="/">Return</Link>
    </Button>
  );
}
