import type { CSSProperties } from 'react';
import { ArrowLeft, CircleCheck, Download, FileText, Folder, ListChecks, Play, Settings, Sparkle, Trash, type LucideIcon } from 'lucide-react';

/** Settings/library glyphs, all Lucide (ISC, see THIRD_PARTY_NOTICES.md). `filled` paints the shape solid. */
const GLYPHS = {
  trash: { icon: Trash },
  download: { icon: Download },
  folder: { icon: Folder, filled: true },
  doc: { icon: FileText },
  gear: { icon: Settings },
  play: { icon: Play, filled: true },
  check_circle: { icon: CircleCheck },
  spark: { icon: Sparkle, filled: true },
  arrow_left: { icon: ArrowLeft },
  tasks: { icon: ListChecks },
} satisfies Record<string, { icon: LucideIcon; filled?: boolean }>;

export type GlyphName = keyof typeof GLYPHS;

export function Glyph({ name, size = 16, opacity, style, className }: { name: GlyphName; size?: number; opacity?: number; style?: CSSProperties; className?: string }) {
  const g: { icon: LucideIcon; filled?: boolean } = GLYPHS[name];
  const Svg = g.icon;
  return <Svg aria-hidden className={className} size={size} strokeWidth={1.9} fill={g.filled ? 'currentColor' : 'none'} style={{ opacity, flexShrink: 0, ...style }} />;
}
