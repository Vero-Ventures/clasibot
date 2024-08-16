// Declare the useMDXComponents function.
// Allows markdown components to rendered in `.tsx` files.
declare module '*.mdx' {
  let MDXComponent: (props: unknown) => JSX.Element;
  export default MDXComponent;
}
