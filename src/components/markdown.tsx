import React from 'react';

// Allows Markdown content to be displayed in Typescript pages.
export default function Markdown({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  // Returns the child content wrapped in a styled article element.
  // Converts the Markdown content to HTML that can be rendered in a page.
  return (
    <article className="prose prose-slate md:prose-xl mx-auto p-6">
      {children}
    </article>
  );
}
