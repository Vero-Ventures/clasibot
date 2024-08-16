import Markdown from '@/components/markdown';
import Data from './data.mdx';

// Terms of Service page that can be visited without login.
export default function Page() {
  // Data is an MDX file that contains the terms of service.
  // Renders the markdown file inside a typescript page.
  return (
    <Markdown>
      <Data />
    </Markdown>
  );
}
