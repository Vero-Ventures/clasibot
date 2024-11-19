/**
 * Defines the basic site informat.
 */
export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'ClasiBot',
  description: 'Classify transactions using AI',
  // Defines the labels and endpoints for each of the footer links.
  //    Also used to define the paths users can visit when not logged in.
  footerItems: [
    {
      label: 'Setup Instructions',
      href: '/add-sbk-instructions',
    },
    {
      label: 'Contact Us',
      href: '/contact-us',
    },
    {
      label: 'Terms of Service',
      href: '/terms-of-service',
    },
    {
      label: 'Privacy Policy',
      href: '/privacy-policy',
    },
  ],
};
