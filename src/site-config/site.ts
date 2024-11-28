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
      label: 'Connection Instructions',
      href: '/connection-instructions',
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
  // Defines the enpoints that are used in email monitoring calls.
  //    Allows outside handler to call endpoints without being redirected.
  emailEndpoints: [
    {
      href: '/api/qbo_invites/connect_firm_clients',
    },
    {
      href: '/api/qbo_invites/connect_to_company',
    },
    {
      href: '/api/qbo_invites/connect_to_firm',
    },
  ],
};
