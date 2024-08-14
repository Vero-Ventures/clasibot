import type { MDXComponents } from 'mdx/types';

// Allows the use of MDX components in the MDXProvider.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
