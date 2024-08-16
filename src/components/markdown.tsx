import React from 'react';

// Takes children as an argument and returns it as a React element..
export default function Markdown({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  // Returns the child content wrapped in a styled article element.
  // Converts the markdown content to HTML using the prose class.
  return (
    <article className="prose prose-slate md:prose-xl mx-auto p-6">
      {children}
    </article>
  );
}
