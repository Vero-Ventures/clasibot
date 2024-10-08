/**
 * Defines the configuration information for the website.
 */
export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'ClasiBot',
  description: 'Classify transactions using AI',
  // Defines the labels and page links for each of the footer items.
  // Also used to define the paths users can visit when not logged in.
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
