import Link from 'next/link';

import { siteConfig } from '@/site-config/site';

export const Footer = () => {
  return (
    <footer className="mt-auto bg-gray-900 p-6 text-white">
      <div className="flex flex-col items-center space-y-4 md:flex-row md:justify-between md:space-y-0">
        <p className="text-center text-sm md:text-base">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All Rights
          Reserved.
        </p>
        <div className="flex flex-wrap justify-center space-x-4">
          {siteConfig.footerItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
