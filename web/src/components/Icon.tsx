import type { CSSProperties } from 'react';
import {
  ArrowDown, ArrowUp, AudioLines, AudioWaveform, BadgeCheck, Bookmark, Check, ChevronDown, ChevronRight, Circle, Clock,
  Copy, Ellipsis, FileText, Hash, LayoutGrid, MessageCircle, Mic, Monitor, PanelLeft, Paperclip, Plus, RotateCw,
  Search, Share, Square, SquarePen, Star, X, type LucideIcon,
} from 'lucide-react';

export type IconName =
  | 'apps' | 'arrow_down' | 'chat_filled' | 'check' | 'chev_down' | 'chev_right' | 'clock' | 'close'
  | 'composer_plus' | 'copy' | 'edit' | 'file' | 'mic' | 'paperclip' | 'plus' | 'record' | 'save'
  | 'search' | 'share' | 'sidebar' | 'slack' | 'star' | 'voice_a' | 'voice_b' | 'verified'
  | 'arrow_up' | 'stop' | 'more' | 'monitor' | 'refresh';

/** Icon name → Lucide glyph (ISC, see THIRD_PARTY_NOTICES.md). `filled` paints the shape solid. */
const ICONS: Record<IconName, { icon: LucideIcon; filled?: boolean }> = {
  apps: { icon: LayoutGrid },
  arrow_down: { icon: ArrowDown },
  arrow_up: { icon: ArrowUp },
  chat_filled: { icon: MessageCircle, filled: true },
  check: { icon: Check },
  chev_down: { icon: ChevronDown },
  chev_right: { icon: ChevronRight },
  clock: { icon: Clock },
  close: { icon: X },
  composer_plus: { icon: Plus },
  copy: { icon: Copy },
  edit: { icon: SquarePen },
  file: { icon: FileText },
  mic: { icon: Mic },
  monitor: { icon: Monitor },
  more: { icon: Ellipsis },
  paperclip: { icon: Paperclip },
  plus: { icon: Plus },
  record: { icon: Circle, filled: true },
  refresh: { icon: RotateCw },
  save: { icon: Bookmark },
  search: { icon: Search },
  share: { icon: Share },
  sidebar: { icon: PanelLeft },
  slack: { icon: Hash },
  star: { icon: Star, filled: true },
  stop: { icon: Square, filled: true },
  verified: { icon: BadgeCheck },
  voice_a: { icon: AudioLines },
  voice_b: { icon: AudioWaveform },
};

interface Props { name: IconName; size?: number; opacity?: number; className?: string; style?: CSSProperties; color?: string }

/** Single-color line icon that inherits `currentColor` (or `color`). */
export function Icon({ name, size = 16, opacity, className, style, color }: Props) {
  const { icon: Glyph, filled } = ICONS[name] ?? ICONS.more;
  return (
    <Glyph
      aria-hidden
      className={className}
      size={size}
      strokeWidth={size <= 12 ? 2.25 : 2}
      fill={filled ? 'currentColor' : 'none'}
      style={{ display: 'inline-block', flexShrink: 0, opacity, color, ...style }}
    />
  );
}
