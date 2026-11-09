import type { ActivityKind, LiveState, Row } from '@shared/types';

/** Activity kind → status phrases for the live activity line. Multi-phrase kinds rotate. */
const PHRASES: Record<string, string[]> = {
  thinking: ['Working out a plan', 'Weighing the options', 'Connecting the dots'],
  working: ['On the task', 'Moving things along', 'Busy with it', 'Taking care of it', 'Making headway'],
  searching_web: ['Searching the web'],
  reading_web: ['Reading up on it'],
  browsing_web: ['Browsing a few sites'],
  reading_file: ['Looking through the file'],
  drafting_file: ['Writing a draft'],
  organizing_files: ['Sorting some files'],
  on_your_computer: ['Using your computer'],
  on_its_computer: ['Using its computer'],
  running_commands: ['Running commands'],
  waiting_on_command: ['Waiting for output'],
  coding: ['Writing code'],
  generating_photo: ['Making an image'],
  generating_video: ['Making a video'],
  messaging_assistant: ['Asking another Bot'],
  messaging: ['Sending a message'],
  connecting_app: ['Using a connected app'],
  waiting_for_you: ['Waiting for your reply'],
  checking_usage: ['Looking at your usage'],
  remembering: ['Saving that for later'],
};

const nice = (s?: string) => !!s && !/[_]/.test(s) && !/^[a-z0-9-]+$/.test(s);

/** Phrase for the activity line. `tick` rotates multi-phrase kinds. */
export function activityPhrase(live: LiveState, rows: Row[], tick: number): string {
  const a = live.activity;
  if (!a) return live.awaiting ? 'Waiting for your reply' : 'On the task';
  const kind = a.kind as ActivityKind;
  if (kind === 'messaging_named') {
    const running = [...rows].reverse().find((r) => r.body.type === 'tool-call' && r.body.status === 'running');
    const args = running?.body.type === 'tool-call' ? (running.body.args as Record<string, unknown> | undefined) : undefined;
    const name = typeof args?.bot_name === 'string' ? args.bot_name : nice(a.detail) ? a.detail : null;
    return name ? `Asking ${name}` : 'Asking another Bot';
  }
  if (kind === 'connecting_service') return nice(a.detail) ? `Using ${a.detail}` : 'Using a connected app';
  const list = PHRASES[kind] ?? PHRASES.working;
  return list[tick % list.length];
}
