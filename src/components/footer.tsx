import Link from 'next/link';
import { siteConfig } from '@/config/site';

const Footer = () => {
  return (
    <footer className="bg-gray-800 p-8 mt-auto">
      <div
        id="FooterContentGrid"
        className="text-white grid grid-cols-2 popout:grid-cols-3 items-center pr-12 popout:pr-0 ">
        <p id="AppCopyright" className="text-center md:text-left mr-6">
          &copy; {siteConfig.name}.
          <span className="block">All Rights Reserved.</span>
        </p>
        <div
          id="FooterLinkContainer"
          className="flex flex-col justify-center md:flex-row space-y-2 md:space-y-0 md:space-x-4 text-center lg:text-left mb:mr-6 popout:mr-0 popout:ml-6">
          {/* Iterates through footer items in the site content and populates links using the href values. */}
          {siteConfig.footerItems.map(item => (
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
