import Markdown from '@/components/markdown';
import Data from './data.mdx';

// Privacy Policy page that can be visited without login.
export default function Page() {
  // Data is an MDX file that contains the privacy policy content.
  // Renders the markdown file inside a typescript page.
  // To Do: Update markdown content for app's second iteration.
  return (
    <Markdown>
      <Data />
    </Markdown>
  );
}
