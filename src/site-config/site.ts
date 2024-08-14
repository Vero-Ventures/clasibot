/**
 * Defines the configuration of the website.
 * Contains basic information about the site: name, description, and footer items.
 */
export type SiteConfig = typeof siteConfig;

// Defines the name of the website, a basic description, and the footer content items.
export const siteConfig = {
  name: 'ClasiBot',
  description: 'Classify transactions using AI',
  // Defines the labels and page links of each of the footer items.
  footerItems: [
    {
      label: 'Privacy Policy',
      href: '/privacy-policy',
    },
    {
      label: 'Terms of Service',
      href: '/terms-of-service',
    },
    {
      label: 'Contact Us',
      href: '/contact-us',
    },
  ],
};
