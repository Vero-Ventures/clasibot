import Link from 'next/link';
import { siteConfig } from '@/config/site';

const Footer = () => {
  return (
    <footer className="mt-auto bg-gray-800 p-8">
      <div
        id="FooterContentGrid"
        className="grid grid-cols-2 items-center pr-12 text-white popout:grid-cols-3 popout:pr-0">
        <p id="AppCopyright" className="mr-6 text-center md:text-left">
          &copy; {siteConfig.name}.
          <span className="block">All Rights Reserved.</span>
        </p>
        <div
          id="FooterLinkContainer"
          className="flex flex-col justify-center space-y-2 text-center mb:mr-6 popout:ml-6 popout:mr-0 md:flex-row md:space-x-4 md:space-y-0 lg:text-left">
          {/* Iterates through footer items in the site content and populates links using the href values. */}
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

// Export the Footer component.
export default Footer;
