/**
 * Defines how the landing page for the application is displayed.
 */
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SignInButton from '@/components/sign-in-button';
import { siteConfig } from '@/config/site';

export default async function Page() {
  // Get the current session.
  const session = await getServerSession();
  if (session) {
    // If session is present, user is logged in. Redirect to home page.
    redirect('/home');
  }
  return (
    <main
      id="MainContentContainer"
      className="flex flex-col flex-1 items-center justify-center text-center w-full max-w-xs md:max-w-3xl px-4 h-full pb-p20 sm:pb-p15 lg:pb-p10 2xl:pb-p5">
      <h1
        id="SiteTitle"
        className="font-extrabold text-gray-800 text-5xl md:text-6xl mb-4">
        {siteConfig.name}
      </h1>
      <p id="CallToAction" className="text-gray-700 text-xl md:text-2xl mb-6">
        Your AI-powered solution for effortless transaction classification
      </p>
      <SignInButton />
    </main>
  );
}
