import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomeButton() {
  return (
    <Button asChild id="HomeButton" className="my-2">
      <Link href="/">Go Back Home</Link>
    </Button>
  );
}
