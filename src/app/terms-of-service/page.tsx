/**
 * Defines the terms of service footer page.
 */
import Markdown from '@/components/markdown';
import Data from './data.mdx';

export default function Page() {
  // Return the defined data as a markdown component.
  // Data is an MDX file that contains the terms of service.
  return (
    <Markdown>
      <Data />
    </Markdown>
  );
}
