import type { ReactNode } from 'react'

// Copy that came from the concept artwork or was written as a stand-in, and has not been
// confirmed by the brand. It is never shown as fact:
//   - with NEXT_PUBLIC_SHOW_PLACEHOLDERS=1 (review builds) it is shown with a visible tag;
//   - without it (production) it is left out of the page entirely.
// To make a piece of copy real, replace it in lib/data.ts with the confirmed wording and
// take it out of its <Placeholder>.
export const SHOW_PLACEHOLDERS = process.env.NEXT_PUBLIC_SHOW_PLACEHOLDERS === '1'

export function Placeholder({ children, what }: { children: ReactNode; what: string }) {
  if (!SHOW_PLACEHOLDERS) return null
  return (
    <div className="placeholder" data-placeholder={what}>
      {children}
      <span className="placeholder__tag">Placeholder: {what}</span>
    </div>
  )
}
