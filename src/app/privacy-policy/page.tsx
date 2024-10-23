import Markdown from '@/components/markdown';
import Data from './data.mdx';

// Privacy Policy page that can be visited without login.
export default function Page() {
  // Data is an MDX file that contains the Privacy Policy.
  // Renders the markdown file inside the typescript page.
  return (
    <Markdown>
      <Data />
    </Markdown>
  );
}
