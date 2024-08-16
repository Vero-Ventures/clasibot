// Declare svg files as modules so that they can be imported in typescript files.
declare module '*.svg' {
  import type React from 'react';
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
