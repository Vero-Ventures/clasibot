/**
 * Defines the privacy policy footer page.
 */
import Markdown from '@/components/markdown';
import Data from './data.mdx';

export default function Page() {
  // Return the defined data as a markdown component.
  // Data is an MDX file that contains the privacy policy content.
  return (
    <Markdown>
      <Data />
    </Markdown>
  );
}
