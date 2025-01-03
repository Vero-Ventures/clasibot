import { getServerSession } from 'next-auth';

import { redirect } from 'next/navigation';

import LandingPage from '@/app/landing/page';

export default async function Page() {
  // Check for a user session and redirect logged-in users to the Home page.
  const session = await getServerSession();
  if (session) {
    redirect('/home');
  }

  return LandingPage();
}
