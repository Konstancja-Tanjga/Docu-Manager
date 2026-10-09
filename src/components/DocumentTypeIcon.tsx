import type { JSX } from 'react';

import type { DocumentType } from '../data/documents';

/**
 * LOCAL COMPONENT — one glyph per document type.
 *
 * Not a gap in the system: its own templates say icon sets are a product
 * decision, and draw theirs the same way this does — a 24-unit grid, a 1.8
 * stroke, round caps and joins, `currentColor`. Matching that keeps these
 * beside the system's own glyphs (the Select chevron, the chip check) without
 * looking borrowed.
 *
 * The two shapes are told apart by silhouette — a tall receipt, a wide
 * factory — so they hold in greyscale and forced colours. The type's name is
 * always rendered beside the icon; the icon never carries it alone.
 *
 * Always decorative: the caller supplies the words.
 */
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

/** A receipt with a torn edge: a bill, rather than any document. */
function InvoiceIcon() {
  return (
    <svg {...base}>
      <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21Z" />
      <path d="M9 8h6" />
      <path d="M9 11.5h6" />
      <path d="M9 15h3.5" />
    </svg>
  );
}

/** A factory with a saw-tooth roof: something made, rather than paid for. */
function ProductionOrderIcon() {
  return (
    <svg {...base}>
      <path d="M3 21V10l5 3v-3l5 3v-3l5 3V4h3v17Z" />
      <path d="M7 17h2" />
      <path d="M12 17h2" />
    </svg>
  );
}

// A Record, so a third document type is a compile error here rather than a
// document quietly drawn as a factory.
const ICONS: Record<DocumentType, () => JSX.Element> = {
  Invoice: InvoiceIcon,
  'Production Order': ProductionOrderIcon,
};

export function DocumentTypeIcon({ type }: { type: DocumentType }) {
  const Icon = ICONS[type];
  return <Icon />;
}
