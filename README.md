<img src="assets/icon.svg" width="64" height="64" alt="">

# grokbot-clone

An open-source take on **always-on AI teammates**: a team of named Bots you give real work to. Each Bot has its own screen on a shared cloud computer, its own memory and routines, and works in your connected apps, asking for approval before risky actions.

It's inspired by xAI's Grok Bot and built entirely on public APIs: the **xAI Grok API** (`grok-4.7`), **Orgo** cloud computers and **Composio** app connections.

> **Not affiliated with xAI, SpaceX or Cursor/Anysphere.** "Grok" is a trademark of its owner, and this project uses it only to describe what it's modeled on. The UI includes the restored artwork from the original design. See `THIRD_PARTY_NOTICES.md` for artwork attribution. It talks only to public APIs with your own keys.

## Features

- **Bots:** create Bots with a name, look, job label and instructions. One is your *primary* Bot. Configure each Bot's skills, memories, routines and thinking effort.
- **Chat:** streaming Grok 4.7 replies with markdown and citations. A live activity line shows what a Bot is doing instead of raw tool calls. Cards cover approvals, questions and "connect this app". You can stop a turn or start a new conversation.
- **Its own computer:** one [Orgo](https://orgo.ai) Linux VM per user, with a separate screen (X display) and desktop per Bot. A Bot can browse with Chrome, use a shell, and drive the mouse and keyboard from screenshots.
  - **Live viewer:** watch a Bot's screen and take control. Watch-only mode is enforced on the server, and the VM password never reaches the browser.
  - **Auto-sleep:** the VM sleeps when idle and wakes when a Bot needs it.
  - **Library:** files a Bot saves appear in your Library.
- **Apps:** sign in with Google and connect 1,000+ apps through [Composio](https://composio.dev). Read-only actions run automatically. Writes such as sending an email pause for approval, and "Always allow" is remembered per action.
- **Routines:** run on a schedule (cron) or on events from connected apps, e.g. "when a new email from X arrives, summarize it".
- **Teamwork:** Bots message each other, spin up parallel subagents, and talk in group chats you can @mention. Your primary Bot can check in proactively, or stay quiet when there's nothing to say.
- **Memory over time:** Bots pick up durable facts after a conversation goes quiet, keep a bounded memory in their prompt with a `recall` tool for the rest, and compact long histories with xAI's `/v1/responses/compact`.
- **Voice:** realtime voice calls with Grok voice. A lightweight voice agent hands real work to the Bot and reads the result back. Also voice choice and speed, preview, and push-to-talk dictation.

## Quick start

You need Node 22.22+, an [xAI API key](https://console.x.ai), a [Composio](https://composio.dev) project API key, and an [Orgo](https://orgo.ai) API key with a workspace.

```bash
git clone https://github.com/nickvasilescu/grokbot-clone && cd grokbot-clone
cp .env.example .env    # fill in XAI_API_KEY, COMPOSIO_API_KEY, ORGO_API_KEY, ORGO_WORKSPACE_ID, SESSION_SECRET
npm install
npm run dev -w server   # API + agent runtime on :8787
npm run dev -w web      # UI on :5173 (proxies /api, including WebSockets)
```

Open http://localhost:5173 and sign in:
- **Sign in with Google** uses Composio's Gmail connection.
- For local testing, set `DEV_LOGIN=1` and use the email form.

A new account starts with a primary Bot. The first time a Bot uses its computer, your Orgo VM is created, which takes about 10–15 seconds and costs Orgo credits.

For production, `npm run build && npm start` serves the built UI from the API server. Set `APP_URL` and `SERVER_URL` to the public URL so OAuth callbacks return to it.

## Architecture

```
web (React + Vite)  ──HTTP + SSE /api/events──▶  server (Node, Hono, SQLite)
        │                                          ├─ agent/loop.ts      Grok 4.7 turn loop, per-Bot queue, approvals pause/resume
        │                                          ├─ agent/tools.ts     computer, browser, shell, files, memory, routines, tasks,
        │                                          │                     bot-to-bot, subagents, groups, questions + Composio tools
        │                                          ├─ agent/memory.ts    compaction + memory consolidation
        │                                          ├─ computer.ts        per-user Orgo VM lifecycle, per-Bot screen leases
        │                                          ├─ composio.ts        catalog, connections, sessions, Google sign-in
        │                                          ├─ routines.ts / triggers.ts / proactive.ts   schedules, app events, check-ins
        │                                          ├─ voice.ts           realtime voice sessions, relay tools, TTS/STT proxy
        └──WS /api/bots/:id/screen─────────────────▶ vnc.ts             VNC relay with server-side auth and watch-only filtering
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data model, the transcript and streaming model, approvals, and how Orgo, xAI and Composio fit together. The builder guides [`docs/orgo-builder-guide.md`](docs/orgo-builder-guide.md) and [`docs/xai-and-composio.md`](docs/xai-and-composio.md) summarize the public APIs this project uses.

## Tests

End-to-end tests drive the real UI with Playwright against a running server, so they use real keys and real Orgo, xAI and Composio calls:

```bash
E2E_EMAIL=you@example.com NODE_PATH=web/node_modules:node_modules node tests/e2e.mjs [baseUrl]
node tests/voice-call.mjs <outDir> <throwawayBotId>   # two-way voice call with a fake microphone
```

`tests/e2e.mjs` covers:
- creating a Bot and getting a streamed Grok reply
- a Bot running a shell on its own Orgo screen
- the computer viewer (watch, take control)
- search and the apps marketplace
- a realtime voice session and a group chat
- bot settings, the Library and Tasks tabs, and app settings

## Configuration

See [`.env.example`](.env.example). Optional knobs:
- **Auto-sleep:** `GROKBOT_IDLE_SUSPEND_MIN`, plus `GROKBOT_IDLE_DRY_RUN` to only log
- **Compaction budget:** `GROKBOT_COMPACT_TOKENS` / `GROKBOT_COMPACT_CHARS`
- **Memory:** `GROKBOT_CONSOLIDATE_IDLE_MIN`
- **Voice models:** `XAI_VOICE_MODEL`, `XAI_STT_MODEL`
- **Schedulers:** `GROKBOT_NO_SCHEDULER=1` turns them off on extra servers that share a database

## Status

This is an experimental prototype. It hasn't been security-audited:
- All of a user's Bots share one VM.
- Secrets stay on the server.
- Approvals cover Composio write actions.

Not built yet:
- an in-VM executor ("box host") for faster computer actions
- skills as `SKILL.md` files with "teach a task" recording
- an AI pre-check of risky actions against your rules
- a local-computer daemon
- meetings

## License

Project code: [MIT](LICENSE). Third-party artwork retains its owners’ rights. Third-party notices are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
