// Declare svg files as modules so that they can be imported to be used as images in typescript files.
declare module '*.svg' {
  import type React from 'react';
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
