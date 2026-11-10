import type { CSSProperties } from 'react';

export type IconName =
  | 'apps' | 'arrow_down' | 'chat_filled' | 'check' | 'chev_down' | 'chev_right' | 'clock' | 'close'
  | 'composer_plus' | 'copy' | 'edit' | 'file' | 'mic' | 'paperclip' | 'plus' | 'record' | 'save'
  | 'search' | 'share' | 'sidebar' | 'slack' | 'star' | 'voice_a' | 'voice_b'
  // inline extras not in the icon font export
  | 'arrow_up' | 'stop' | 'more' | 'monitor' | 'refresh' | 'bag';

const INLINE: Partial<Record<IconName, string>> = {
  arrow_up: 'M12 4.5a1 1 0 0 1 .7.3l6 6a1 1 0 0 1-1.4 1.4L13 7.9V19a1 1 0 1 1-2 0V7.9l-4.3 4.3a1 1 0 1 1-1.4-1.4l6-6a1 1 0 0 1 .7-.3Z',
  stop: 'M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  more: 'M5 10.25a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Zm7 0a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Zm7 0a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z',
  monitor: 'M4.5 4h15A2.5 2.5 0 0 1 22 6.5v9a2.5 2.5 0 0 1-2.5 2.5H13v1.5h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3V18H4.5A2.5 2.5 0 0 1 2 15.5v-9A2.5 2.5 0 0 1 4.5 4Zm0 2a.5.5 0 0 0-.5.5v9c0 .28.22.5.5.5h15a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-15Z',
  refresh: 'M12 4a8 8 0 0 1 7.2 4.5V6a1 1 0 1 1 2 0v5a1 1 0 0 1-1 1h-5a1 1 0 1 1 0-2h2.6A6 6 0 1 0 18 14.4a1 1 0 1 1 1.9.6A8 8 0 1 1 12 4Z',
  bag: 'M8 7V6a4 4 0 1 1 8 0v1h2.5A1.5 1.5 0 0 1 20 8.5v11A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-11A1.5 1.5 0 0 1 5.5 7H8Zm2 0h4V6a2 2 0 1 0-4 0v1Zm-4 2v10.5c0 .28.22.5.5.5h11a.5.5 0 0 0 .5-.5V9H6Z',
};

interface Props { name: IconName; size?: number; opacity?: number; className?: string; style?: CSSProperties; color?: string }

/** Single-color glyph from /assets/icons drawn as a CSS mask so it takes `currentColor`. */
export function Icon({ name, size = 16, opacity, className, style, color }: Props) {
  const inline = INLINE[name];
  if (inline) {
    return (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ opacity, color, flexShrink: 0, ...style }}>
        <path d={inline} fill="currentColor" />
      </svg>
    );
  }
  const url = `url(/assets/icons/${name}.svg)`;
  return (
    <span
      aria-hidden
      className={className}
      style={{
        display: 'inline-block', flexShrink: 0, width: size, height: size, opacity, color,
        backgroundColor: 'currentColor', WebkitMask: `${url} center / 100% 100% no-repeat`, mask: `${url} center / 100% 100% no-repeat`,
        ...style,
      }}
    />
  );
}
