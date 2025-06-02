
import type { ReactNode } from 'react';

export default function SearchLayout({ children }: { children: ReactNode }) {
  // PANDA Search has specific fonts (Poppins, Open Sans) and colors (Violet, Blue).
  // These will be applied via Tailwind utility classes within the components.
  // The global theme provides a base.
  return (
    <div className="font-open-sans"> 
      {/* Apply Open Sans as base body font for this section */}
      {children}
    </div>
  );
}
