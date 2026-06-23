# @mr-m/tg-kit 📱

> **Professional Telegram SDK** — Mini Apps + Bot API in a single, type-safe, zero-dependency package.

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/@mr-m/tg-kit?style=flat-square&color=2AABEE&logo=npm)](https://www.npmjs.com/package/@mr-m/tg-kit)
[![Downloads](https://img.shields.io/npm/dm/@mr-m/tg-kit?style=flat-square&color=brightgreen)](https://www.npmjs.com/package/@mr-m/tg-kit)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@mr-m/tg-kit?style=flat-square&color=blueviolet)](https://bundlephobia.com/package/@mr-m/tg-kit)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bot API](https://img.shields.io/badge/Bot%20API-9.x-2AABEE?style=flat-square&logo=telegram&logoColor=white)](https://core.telegram.org/bots/api)

**[📖 Full Docs](./docs)** • **[🤖 Bot Guide](./docs/bot.md)** • **[📱 Mini App Guide](./docs/mini-app.md)** • **[🌐 Vanilla JS / HTML](./docs/vanilla-html-js.md)** • **[💬 Telegram](https://t.me/eogri)**

</div>

---

## ✨ Why tg-kit?

- 🎯 **Two SDKs, one package** — Mini App (browser/React) **and** Bot API (server) — covered end-to-end.
- 🪶 **Zero runtime dependencies** — pure TypeScript, tree-shakable, SSR-safe.
- 🔐 **Server-grade security** — `initData` validation (HMAC + Ed25519), works on Node **and** Edge.
- ⚡ **Bot API 9.x complete** — Business accounts, Checklists, Stars, Paid Media, Stories, Forum topics, Stickers.
- ⚛️ **30+ React hooks** — buttons, theme, viewport, fullscreen, biometric, location, storage, haptics, QR…
- 📦 **Every format** — ESM, CJS, `.d.ts`, IIFE (`<script>` tag, `window.TgKit`).
- 🧪 **Dev-mode mock** — develop your Mini App in a normal browser.

---

## 📦 Install

```bash
npm  install @mr-m/tg-kit
pnpm add     @mr-m/tg-kit
bun  add     @mr-m/tg-kit
yarn add     @mr-m/tg-kit
```

> React `>= 18` and React-DOM are **peer-optional** — only required if you use `./hooks` or the React providers.

---

## 🚀 60-second quick start

### Mini App (React)

```tsx
'use client';
import { TelegramProvider, useTelegram, useTelegramMainButton } from '@mr-m/tg-kit';

function App() {
  const { user, colorScheme } = useTelegram();
  useTelegramMainButton({ text: 'Continue', onClick: () => alert('clicked') });
  return <h1 data-theme={colorScheme}>Hello, {user?.first_name}!</h1>;
}

export default () => (
  <TelegramProvider options={{ autoExpand: true, autoReady: true }}>
    <App />
  </TelegramProvider>
);
```

### Bot (Node / Edge)

```ts
import { TelegramBot } from '@mr-m/tg-kit/bot';

const bot = new TelegramBot({ token: process.env.BOT_TOKEN! });
await bot.sendMessage({ chat_id: 123456789, text: 'Hello from tg-kit 👋' });
```

### Validate Mini App `initData` server-side

```ts
import { validateInitData } from '@mr-m/tg-kit/server';

const result = await validateInitData(initData, process.env.BOT_TOKEN!, {
  runtime: 'edge', maxAgeSeconds: 3600,
});
if (!result.valid) throw new Error(result.reason);
```

---

## 🧩 Entry points

| Import | Use from | Contents |
|---|---|---|
| `@mr-m/tg-kit` | Anywhere (React) | Hooks, providers, core utils, types |
| `@mr-m/tg-kit/core` | Any browser code | Imperative WebApp helpers (no React) |
| `@mr-m/tg-kit/hooks` | React | 30+ hooks only |
| `@mr-m/tg-kit/server` | Node / Edge | `validateInitData(Sync)` |
| `@mr-m/tg-kit/bot` | Node / Edge | `TelegramBot`, `Dispatcher`, `TelegramPoller` |
| `@mr-m/tg-kit/cdn` | Browser | `loadTelegramScript`, `getTelegramCdnUrl` |
| `@mr-m/tg-kit/dev` | Dev only | `installDevMode`, `createMockWebApp` |
| `<script src=".../browser.iife.js">` | HTML | Global `window.TgKit` |

> ⚠️ **Never** import `/bot` or `/server` from client code — they require the bot token.

---

## 📚 Documentation

Deep dives for each surface live in [`docs/`](./docs):

| Guide | What's inside |
|---|---|
| 🤖 **[docs/bot.md](./docs/bot.md)** | `TelegramBot`, `Dispatcher`, `TelegramPoller`, webhooks, payments (Stars), inline mode, files, error handling |
| 📱 **[docs/mini-app.md](./docs/mini-app.md)** | `TelegramProvider`, every hook, theme/viewport/fullscreen, storage, biometric, location, full Next.js example, server validation |
| 🌐 **[docs/vanilla-html-js.md](./docs/vanilla-html-js.md)** | CDN `<script>` usage, `@mr-m/tg-kit/core` from vanilla JS, Vue/Svelte snippets, mock dev mode |

---

## 🎮 Live, runnable examples

The repo ships three working demos under [`demo/`](./demo):

| Path | Stack | Demonstrates |
|---|---|---|
| 📂 **[`demo/bot/`](./demo/bot)** | Node + Express, deployable to Vercel | Webhook bot, `setWebhook` with `secret_token`, inline keyboards, payments (Stars), inline queries, file download |
| 📂 **[`demo/html/`](./demo/html)** | Single `index.html`, zero build | Full WebApp surface from vanilla JS via the IIFE bundle |
| 📂 **[`demo/nextjs/`](./demo/nextjs)** | Next.js 16 App Router + TonConnect | `TelegramProvider`, `FullscreenProvider`, `loadTelegramScript`, webhook route, Stars invoice route, TON manifest |

> 👉 Open each `demo/<folder>/README` (or follow the corresponding guide in [`docs/`](./docs)) for setup instructions.

---

## ✅ Compatibility

| Environment | Status |
|---|---|
| React 18 / 19 | ✅ |
| Next.js 14 / 15 / 16 (App + Pages router) | ✅ |
| Node.js 18+ | ✅ |
| Edge runtimes (Vercel Edge, Cloudflare Workers, Deno) | ✅ |
| Vue 3 / Svelte / Solid / vanilla JS | ✅ (via `/core` or `/cdn`) |
| Telegram Bot API | **9.x** (latest) |
| TypeScript | 5.0+ strict mode |

---

## 💝 Support the project

If `@mr-m/tg-kit` helps you ship — consider supporting development ❤️

| Method | Address / Link |
|---|---|
| 💎 **Toncoin (TON)** | `mr-m-applications.ton` |
| ⭐ **GitHub Star** | [github.com/mr-m-apps/tg-kit](https://github.com/mr-m-apps/tg-kit) |
| 💬 **Telegram** | [@eogri](https://t.me/eogri) |

---

## 🔗 Resources

- 📘 [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- 📗 [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- 📦 [npm — @mr-m/tg-kit](https://www.npmjs.com/package/@mr-m/tg-kit)
- 💻 [GitHub Repo](https://github.com/mr-m-apps/tg-kit)

---

## 📜 License

MIT © [mr-m-apps](https://github.com/mr-m-apps)
