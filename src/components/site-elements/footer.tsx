import Link from 'next/link';

import { siteConfig } from '@/site-config/site';

export const Footer = () => {
  return (
    <footer className="mt-auto bg-gray-900 p-6 text-white">
      <div className="flex flex-col items-center space-y-2 sm:space-y-4">
        <div className="grid w-full grid-cols-2 grid-rows-2 justify-evenly gap-y-4 mb:px-8 sm:flex sm:px-0 md:px-12 lg:px-20">
          <Link
            key={'/add-sbk-instructions'}
            href={'/add-sbk-instructions'}
            className="text-center text-lg font-semibold hover:underline">
            Setup Instructions
          </Link>
          <Link
            key={'/contact-us'}
            href={'/contact-us'}
            className="text-center text-lg font-semibold hover:underline">
            Contact Us
          </Link>
          <Link
            key={'/terms-of-service'}
            href={'/terms-of-service'}
            className="text-center hover:underline">
            Terms of Service
          </Link>
          <Link
            key={'/privacy-policy'}
            href={'/privacy-policy'}
            className="text-center hover:underline">
            Privacy Policy
          </Link>
        </div>
        <p className="text-center text-base italic">
          &copy; {new Date().getFullYear()} {siteConfig.name} - All Rights
          Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
