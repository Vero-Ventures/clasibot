import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SignInButton from '@/components/inputs/sign-in-button';
import { siteConfig } from '@/site-config/site';

// Landing Page.
export default async function Page() {
  // Get the server session and send user to home page if they are already logged in.
  const session = await getServerSession();
  if (session) {
    redirect('/home');
  }

  console.log('test');




  

  return (
    <main
      id="LandingPageContainer"
      className="flex h-full w-full max-w-xs flex-1 flex-col items-center justify-center px-4 pb-p20 text-center sm:pb-p15 md:max-w-3xl lg:pb-p10 2xl:pb-p5">
      <h1
        id="SiteTitle"
        className="mb-4 text-5xl font-extrabold text-gray-800 md:text-6xl">
        {siteConfig.name}
      </h1>
      <p id="CallToAction" className="mb-6 text-xl text-gray-700 md:text-2xl">
        Your AI-powered solution for effortless transaction classification
      </p>
      <SignInButton />
    </main>
  );
}
