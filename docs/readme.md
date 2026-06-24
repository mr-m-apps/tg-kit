# @mr-m/tg-kit

A production-ready, **type-safe** Telegram ecosystem SDK that covers both
sides of the platform in a single library:

- **Mini Apps (WebApp)** — full `window.Telegram.WebApp` wrapper, React
  hooks, providers, theme/viewport/fullscreen, biometric, location,
  cloud / device / secure storage, popups, scan-QR, stories, gifts,
  custom-method invocation and more.
- **Bot API (server-side)** — fully typed `TelegramBot` client covering
  Bot API **9.x** (Business accounts, Checklists, Stories, Stars, Paid
  Media, Forum topics, Stickers, Live location, …), update `Dispatcher`,
  long-polling helper.
- **Server-side `initData` validation** — Node **and** Edge runtimes,
  HMAC `hash` check

No dependencies. ESM + CJS. Tree-shakable. SSR-safe.

---

## Table of contents

1. [Install](#install)
2. [Entry points](#entry-points)
3. [Mini App — quick start (React)](#mini-app--quick-start-react)
4. [Mini App — browser utilities](#mini-app--browser-utilities)
5. [Mini App — React hooks](#mini-app--react-hooks)
6. [Providers](#providers)
7. [Server — validate `initData`](#server--validate-initdata)
8. [Bot API — `TelegramBot`](#bot-api--telegrambot)
9. [Update routing — `Dispatcher`](#update-routing--dispatcher)
10. [Long-polling — `TelegramPoller`](#long-polling--telegrampoller)
11. [Dev mode (mock WebApp)](#dev-mode-mock-webapp)
12. [Full example — Next.js App Router](#full-example--nextjs-app-router-mini-app--bot-webhook)
13. [Security notes](#security-notes)
14. [License](#license)

---

## Install

```bash
npm install @mr-m/tg-kit
# or
pnpm add @mr-m/tg-kit
# or
bun add @mr-m/tg-kit
```

Requirements: Node `>=18`, React `>=18` (optional — only needed for the
`./hooks` entry points), TypeScript `>=5` (optional).

---

## Entry points

| Import path                  | Use it from         | What's inside                                                 |
| ---------------------------- | ------------------- | ------------------------------------------------------------- |
| `@mr-m/tg-kit`               | anywhere            | Re-exports everything below        
`useTelegram`, all hooks                  |
| `@mr-m/tg-kit/hooks`         | 
| `@mr-m/tg-kit/core`          | any browser code    | `getWebApp`, `ensureWebApp`, `isInTelegram`                   |
| `@mr-m/tg-kit/server`        | Node / Edge server  | `validateInitData`, `validateInitDataSync`                    |
| `@mr-m/tg-kit/bot`           | Node / Edge server  | `TelegramBot`, `Dispatcher`, `TelegramPoller`, all Bot types  |
| `@mr-m/tg-kit/dev`           | development only    | `mockWebApp`, `installDevWebApp` for local development        |
| `@mr-m/tg-kit/cdn`           | `<script>` tag      | Minified IIFE (`window.TgKit`) — no bundler required          |

The split protects you from leaking the bot token client-side: never
import from `/bot` or `/server` in client code.

---

## Mini App — quick start (React)

```tsx
'use client';

import {
  TelegramProvider,
  useTelegram,
  useReady,
  useTelegramMainButton,
} from '@mr-m/tg-kit';

function App() {
  return (
    <TelegramProvider options={{ autoExpand: true, autoReady: true }}>
      <Home />
    </TelegramProvider>
  );
}

function Home() {
  useReady(); // calls WebApp.ready() once
  const { user, colorScheme, startParam } = useTelegram();

  useTelegramMainButton({
    text: 'Continue',
    onClick: () => alert('clicked'),
  });

  return (
    <main data-theme={colorScheme}>
      <h1>Hello, {user?.first_name ?? 'guest'}!</h1>
      {startParam && <p>start_param: {startParam}</p>}
    </main>
  );
}
```

---

### Helpers index

| Helper               | Methods                                                                                 | Min Bot API |
| -------------------- | --------------------------------------------------------------------------------------- | ----------- |
| `haptic`             | `impact`, `notification`, `selection`                                                   | 6.1         |
| `cloudStorage`       | `setItem`, `getItem`, `getItems`, `removeItem`, `removeItems`, `getKeys`                | 6.9         |
| `deviceStorage`      | `setItem`, `getItem`, `removeItem`, `clear`                                             | 9.0         |
| `secureStorage`      | `setItem`, `getItem`, `restoreItem`, `removeItem`, `clear`                              | 9.0         |
| `dialog`             | `alert`, `confirm`, `popup`                                                             | 6.2         |
| `invokeCustomMethod` | `(method, params?) => Promise<unknown>`                                                 | 6.9         |
| `biometric`          | `init`, `requestAccess`, `authenticate`, `updateBiometricToken`, `openSettings`         | 7.2         |
| `location`           | `init`, `getLocation`, `openSettings`                                                   | 8.0         |
| `scanQr`             | `(params?) => Promise<string \| null>` + `close()`                                      | 6.4         |

---

## Mini App — React hooks

All hooks are exported from `@mr-m/tg-kit`. They are SSR-safe (return
sensible defaults until `window.Telegram.WebApp` is available).

### Core

| Hook                          | Returns                                              |
| ----------------------------- | ---------------------------------------------------- |
| `useTelegramWebApp()`         | `TgWebApp \| null`                                   |
| `useTelegramUser()`           | `TgUser \| null`                                     |
| `useTelegramStartParam()`     | `string \| null`                                     |
| `useInitData()`               | raw `initData` string (sign on the server)           |
| `useReady()`                  | calls `WebApp.ready()` once on mount                 |
| `useTelegramEvent(type, fn)`  | subscribe to any `WebAppEventType`                   |
| `useIsActive()`               | `boolean` — tracks `activated`/`deactivated`         |

### UI / chrome

| Hook                              | Purpose                                          |
| --------------------------------- | ------------------------------------------------ |
| `useTelegramBackButton(opts?)`    | wire BackButton to router/history                |
| `useTelegramMainButton(opts)`     | declarative MainButton                           |
| `useTelegramSecondaryButton(opts)`| declarative SecondaryButton                      |
| `useTelegramSettingsButton(fn)`   | SettingsButton click handler                     |
| `useHapticFeedback()`             | `{ impact, notification, selection }`            |
| `useTelegramTheme()`              | `{ colorScheme, themeParams, isDark }` reactive  |
| `useTelegramViewport()`           | `{ height, stableHeight, isExpanded, expand }`   |
| `useTelegramFullscreen()`         | `{ isFullscreen, error, enter, exit, toggle }`   |
| `useOrientationLock()`            | `{ isLocked, lock, unlock }`                     |
| `useSafeArea()`                   | `{ safeArea, contentSafeArea }` reactive         |

### Storage

| Hook                  | Backend                       |
| --------------------- | ----------------------------- |
| `useCloudStorage()`   | per-user cloud (Telegram)     |
| `useDeviceStorage()`  | per-device (Bot API 9.0+)     |
| `useSecureStorage()`  | secure enclave (Bot API 9.0+) |

### Sensors / device

`useAccelerometer`, `useGyroscope`, `useDeviceOrientation`, `useBiometric`,
`useLocation`.

### Dialogs & system UI

| Hook                          | Returns                                                |
| ----------------------------- | ------------------------------------------------------ |
| `useShowPopup()`              | `(params) => Promise<string \| null>`                  |
| `useShowAlert()`              | `(msg) => Promise<void>`                               |
| `useShowConfirm()`            | `(msg) => Promise<boolean>`                            |
| `useScanQrPopup()`            | `(params?) => Promise<string \| null>`                 |
| `useReadTextFromClipboard()`  | `() => Promise<string \| null>`                        |

### Sharing / requests

`useHomeScreen`, `useShareToStory`, `useShareMessage`, `useSetEmojiStatus`,
`useRequestEmojiStatusAccess`, `useDownloadFile`, `useRequestWriteAccess`,
`useRequestContact`, `useSwitchInlineQuery`, `useRequestChat`,
`useHideKeyboard`, `useInvokeCustomMethod`.

---

## Providers

### `<TelegramProvider>`

```tsx
<TelegramProvider
  options={{
    autoExpand: true,        // call WebApp.expand() on mount
    autoReady: true,         // call WebApp.ready() on mount
    enableClosingConfirmation: true,
    debug: process.env.NODE_ENV !== 'production',
    onReady: (wa) => console.log('Telegram WebApp', wa.version),
    onUserReady: (user) => console.log('user', user),
  }}
>
  {children}
</TelegramProvider>
```

`useTelegram()` returns: `{ webApp, user, colorScheme, themeParams,
startParam, initData, isReady, isInTelegram, viewport }`.

### `<FullscreenProvider>`

Wraps your Mini App to manage fullscreen state app-wide. Use
`useFullscreen()` inside.

## It should be added 

```css

:root {
  --tg-safe-area-inset-top: 0px;
  --tg-safe-area-inset-bottom: 0px;
  --tg-safe-area-inset-left: 0px;
  --tg-safe-area-inset-right: 0px;
  --tg-content-safe-area-inset-top: 0px;
  --tg-content-safe-area-inset-bottom: 0px;
  --tg-content-safe-container-top: 0px;
  --tg-content-safe-area-inset-left: 0px;
  --tg-content-safe-area-inset-right: 0px;
}

```

The goal is to add the safe spaces provided by Telegram. 

---

## Server — validate `initData`

The single most important thing for Mini App security: **never trust
`initDataUnsafe`**. Always send the raw `initData` string to your server
and validate it.

### Node.js (sync — fastest)

```ts
import { validateInitDataSync } from '@mr-m/tg-kit/server';

const result = validateInitDataSync(initData, process.env.BOT_TOKEN!, {
  maxAgeSeconds: 86_400, // 1 day
});

if (!result.valid) {
  // result.reason: 'invalid_hash' | 'expired' | 'missing_hash' | 'malformed'
  throw new Error(`bad initData: ${result.reason}`);
}

const user = result.user; // typed TgUser
```

### Node **or** Edge (async)

`validateInitData` works in any runtime. On Edge it uses `crypto.subtle`,
on Node it lazy-loads `node:crypto`. **Use this entry point from
Cloudflare Workers, Vercel Edge, Deno, etc.**

```ts
import { validateInitData } from '@mr-m/tg-kit/server';

const result = await validateInitData(initData, process.env.BOT_TOKEN!, {
  runtime: 'edge',         // or 'node' (default)
  maxAgeSeconds: 3600,
  strict: false,           // throw on failure when true
});
```

### Options

```ts
interface ValidateInitDataOptions {
  maxAgeSeconds?: number;   // default 86400
  runtime?: 'node' | 'edge'; // default 'node'
  parseUser?: boolean;      // parse data.user into TgUser
  strict?: boolean;         // throw on failure
  skipAuthDateCheck?: boolean;
  extractStartParam?: boolean;
  extractChat?: boolean;
  parseUnsafeData?: boolean;
  verifySignature?: boolean;
}
```

---

## Bot API — `TelegramBot`

```ts
import { TelegramBot, TelegramApiError } from '@mr-m/tg-kit/bot';

const bot = new TelegramBot({
  token: process.env.BOT_TOKEN!,
  apiBase: 'https://api.telegram.org', // override for local Bot API server
  timeout: 30_000,
});

const me = await bot.getMe();

await bot.sendMessage({
  chat_id: 12345,
  text: '<b>Hello</b>',
  parse_mode: 'HTML',
  reply_markup: {
    inline_keyboard: [[{ text: 'Open Mini App', web_app: { url: 'https://example.com' } }]],
  },
});
```

### Coverage (Bot API 9.x)

- **Messages**: `sendMessage`, `sendPhoto`, `sendAudio`, `sendDocument`,
  `sendVideo`, `sendAnimation`, `sendVoice`, `sendVideoNote`,
  `sendSticker`, `sendLocation`, `editMessageLiveLocation`,
  `stopMessageLiveLocation`, `sendVenue`, `sendContact`, `sendPoll`,
  `sendDice`, `sendChatAction`, `sendMediaGroup`, `setMessageReaction`,
  `forward*`, `copy*`, `edit*`, `delete*`, `pin*`, `unpin*`.
- **Checklists (9.0+)**: `sendChecklist`, `editMessageChecklist`.
- **Payments / Stars**: `sendInvoice`, `createInvoiceLink`,
  `answerPreCheckoutQuery`, `answerShippingQuery`, `refundStarPayment`,
  `getStarTransactions`, `editUserStarSubscription`,
  `setMyStarTransactionWithdrawalLimit`, `sendPaidMedia`.
- **Gifts**: `getAvailableGifts`, `sendGift`, plus business-account
  variants below.
- **Business Accounts (9.x)**: `getBusinessConnection`,
  `readBusinessMessage`, `deleteBusinessMessages`,
  `getBusinessAccountGifts`, `getBusinessAccountStarBalance`,
  `convertGiftToStars`, `upgradeGift`, `transferGift`,
  `transferBusinessAccountStars`, `setBusinessAccountName/Username/Bio`,
  `setBusinessAccountProfilePhoto`,
  `removeBusinessAccountProfilePhoto`, `setBusinessAccountGiftSettings`.
- **Stories on behalf of business**: `postStory`, `editStory`, `deleteStory`.
- **Chat / member**: `getChat`, `getChatAdministrators`,
  `getChatMemberCount`, `getChatMember`, `ban*`, `unban*`,
  `restrictChatMember`, `promoteChatMember`,
  `setChatAdministratorCustomTitle`, `setChatPermissions`,
  `createChatInviteLink`, `editChatInviteLink`, `revokeChatInviteLink`,
  `approveChatJoinRequest`, `declineChatJoinRequest`,
  `setChatPhoto/Title/Description`, `leaveChat`, `setChatStickerSet`,
  `deleteChatStickerSet`.
- **Subscriptions**: `createChatSubscriptionInviteLink`,
  `editChatSubscriptionInviteLink`.
- **Forum topics**: `createForumTopic`, `editForumTopic`,
  `closeForumTopic`, `reopenForumTopic`, `deleteForumTopic`,
  `unpinAllForumTopicMessages`, `getForumTopicIconStickers`,
  `editGeneralForumTopic`, `closeGeneralForumTopic`,
  `reopenGeneralForumTopic`, `hideGeneralForumTopic`,
  `unhideGeneralForumTopic`, `unpinAllGeneralForumTopicMessages`.
- **Stickers**: `getStickerSet`, `getCustomEmojiStickers`,
  `uploadStickerFile`, `createNewStickerSet`, `addStickerToSet`,
  `setStickerPositionInSet`, `deleteStickerFromSet`, `replaceStickerInSet`,
  `setStickerEmojiList/Keywords/MaskPosition`,
  `setStickerSetTitle/Thumbnail`, `setCustomEmojiStickerSetThumbnail`,
  `deleteStickerSet`.
- **Inline / callback / Web App**: `answerInlineQuery`,
  `answerCallbackQuery`, `answerWebAppQuery`,
  `savePreparedInlineMessage`.
- **Passport**: `setPassportDataErrors`.
- **Verification (9.x)**: `verifyUser`, `removeUserVerification`,
  `verifyChat`, `removeChatVerification`, `setUserEmojiStatus`,
  `allowUserMessages`, `disallowUserMessages`.
- **Bot config**: `setMyCommands`, `getMyCommands`, `deleteMyCommands`,
  `getChatMenuButton`, `setChatMenuButton`,
  `setMyDefaultAdministratorRights`, `getMyDefaultAdministratorRights`,
  `setMyName/Description/ShortDescription` (+ getters).
- **Webhooks**: `setWebhook`, `deleteWebhook`, `getWebhookInfo`,
  `getUpdates`.
- **Files**: `getFile`, `getFileWithUrl` (helper), `getFileDownloadUrl`.
- **Games**: `sendGame`, `setGameScore`, `getGameHighScores`.
- **Escape hatch**: `bot.callMethod<T>('newApiMethod', params)` for any
  brand-new method not yet wrapped.

### Error handling

Every method throws `TelegramApiError` on a non-`ok` response:

```ts
try {
  await bot.sendMessage({ chat_id, text });
} catch (e) {
  if (e instanceof TelegramApiError) {
    console.error(e.code, e.description, e.parameters);
    if (e.parameters?.retry_after) {
      // flood-control: wait and retry
    }
  }
}
```

### File download

```ts
const { downloadUrl } = await bot.getFileWithUrl(file_id);
const blob = await fetch(downloadUrl).then((r) => r.blob());
```

---

## Update routing — `Dispatcher`

```ts
import { TelegramBot, Dispatcher } from '@mr-m/tg-kit/bot';

const bot = new TelegramBot({ token });
const me = await bot.getMe();

const dispatcher = new Dispatcher({
  botUsername: me.username,   // so `/start@MyBot` matches in groups
  onError: (err, update) => console.error('handler error', err, update),
});

dispatcher
  .onCommand('start', (msg) =>
    bot.sendMessage({ chat_id: msg.chat.id, text: 'Welcome!' })
  )
  .onMessage(async (msg) => {
    if (msg.text) await bot.sendMessage({ chat_id: msg.chat.id, text: `Echo: ${msg.text}` });
  })
  .onCallbackQuery(async (q) => {
    await bot.answerCallbackQuery({ callback_query_id: q.id, text: 'OK' });
  }, /^buy:/)
  .onBusinessMessage((msg) => { /* … */ })
  .onEditedChannelPost((msg) => { /* … */ })
  .onDeletedBusinessMessages((event) => { /* … */ })
  .onPoll((poll) => { /* … */ })
  .onChatJoinRequest((req) => bot.approveChatJoinRequest({ chat_id: req.chat.id, user_id: req.from.id }));

// Use it from a webhook:
export async function POST(req: Request) {
  const update = await req.json();
  await dispatcher.dispatch(update);
  return new Response('ok');
}
```

Full list of handler hooks: `onMessage`, `onCommand`, `onEditedMessage`,
`onChannelPost`, `onEditedChannelPost`, `onBusinessMessage`,
`onEditedBusinessMessage`, `onDeletedBusinessMessages`, `onPoll`,
`onPollAnswer`, `onCallbackQuery`, `onInlineQuery`,
`onChosenInlineResult`, `onShippingQuery`, `onPreCheckoutQuery`,
`onMyChatMember`, `onChatMember`, `onChatJoinRequest`, `onChatBoost`,
`onRemovedChatBoost`, `onMessageReaction`, `onMessageReactionCount`,
`onBusinessConnection`, `onPurchasedPaidMedia`.

---

## Long-polling — `TelegramPoller`

```ts
import { TelegramBot, TelegramPoller, Dispatcher } from '@mr-m/tg-kit/bot';

const bot = new TelegramBot({ token });
const dispatcher = new Dispatcher();
// …register handlers…

const poller = new TelegramPoller(bot, dispatcher.toHandler(), {
  timeout: 30,
  allowedUpdates: ['message', 'callback_query', 'business_message'],
});

await poller.start();
// later: poller.stop();
```

---

## Dev mode (mock WebApp)

Develop your Mini App in a normal browser:

```ts
import { installDevWebApp } from '@mr-m/tg-kit/dev';

if (process.env.NODE_ENV !== 'production' && !window.Telegram) {
  installDevWebApp({
    user: { id: 1, first_name: 'Dev', username: 'dev', language_code: 'en' },
    colorScheme: 'dark',
    initData: 'mock', // gets parsed by validateInitData (will be invalid — by design)
  });
}
```

---

## Full example — Next.js App Router (Mini App + bot webhook)

File layout:

```text
app/
├── layout.tsx
├── providers.tsx
├── page.tsx                      # Mini App home
└── api/
    ├── auth/route.ts             # validates initData
    └── telegram/webhook/route.ts # bot webhook
```

### `app/providers.tsx`

```tsx
'use client';

import { TelegramProvider } from '@mr-m/tg-kit';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider options={{ autoExpand: true, autoReady: true }}>
      {children}
    </TelegramProvider>
  );
}
```

### `app/layout.tsx`

```tsx
import Script from 'next/script';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* official Telegram WebApp runtime — required */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


```
You can use .loadTelegramScript or .getTelegramCdnUrl directly.

### `app/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTelegram, useReady, useTelegramMainButton, useInitData } from '@mr-m/tg-kit';

export default function Home() {
  useReady();
  const { user, colorScheme } = useTelegram();
  const initData = useInitData();
  const [me, setMe] = useState<{ id: number; first_name: string } | null>(null);

  useEffect(() => {
    if (!initData) return;
    fetch('/api/auth', {
      method: 'POST',
      headers: { Authorization: `tma ${initData}` },
    })
      .then((r) => r.json())
      .then(setMe);
  }, [initData]);

  useTelegramMainButton({
    text: 'Buy now',
    onClick: () => alert('purchase flow'),
  });

  return (
    <main data-theme={colorScheme}>
      <h1>Hi {user?.first_name}</h1>
      <pre>Verified server-side: {JSON.stringify(me, null, 2)}</pre>
    </main>
  );
}
```

### `app/api/auth/route.ts`

```ts
import { NextResponse } from 'next/server';
import { validateInitData } from '@mr-m/tg-kit/server';

export const runtime = 'edge'; // works in node too — same code

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const initData = auth.startsWith('tma ') ? auth.slice(4) : '';

  const result = await validateInitData(initData, process.env.BOT_TOKEN!, {
    runtime: 'edge',
    maxAgeSeconds: 3600,
  });

  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }

  return NextResponse.json(result.user);
}
```

### `app/api/telegram/webhook/route.ts`

```ts
import { NextResponse } from 'next/server';
import { TelegramBot, Dispatcher } from '@mr-m/tg-kit/bot';

export const runtime = 'nodejs';   // bot API client can run on edge too
export const dynamic = 'force-dynamic';

const bot = new TelegramBot({ token: process.env.BOT_TOKEN! });
const dispatcher = new Dispatcher();

dispatcher
  .onCommand('start', (msg) =>
    bot.sendMessage({
      chat_id: msg.chat.id,
      text: 'Open the Mini App:',
      reply_markup: {
        inline_keyboard: [[{ text: 'Open', web_app: { url: process.env.WEBAPP_URL! } }]],
      },
    })
  )
  .onCallbackQuery((q) =>
    bot.answerCallbackQuery({ callback_query_id: q.id, text: 'OK' })
  );

export async function POST(req: Request) {
  // Optional: verify Telegram's secret_token header (set via setWebhook)
  if (req.headers.get('x-telegram-bot-api-secret-token') !== process.env.WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  const update = await req.json();
  await dispatcher.dispatch(update);
  return NextResponse.json({ ok: true });
}
```

Register the webhook once (e.g. from a one-off script):

```ts
await bot.setWebhook({
  url: 'https://your-app.vercel.app/api/telegram/webhook',
  secret_token: process.env.WEBHOOK_SECRET!,
  allowed_updates: ['message', 'callback_query', 'business_message'],
});
```

---

## Security notes

1. **Never trust `initDataUnsafe`** on the server — it is unsigned. Always
   send the raw `initData` string and validate with
   `validateInitData(Sync)`.
2. **Never import `@mr-m/tg-kit/bot` or `/server` from client code** —
   they require the bot token. The package is split so a `'client only'`
   bundle of the wrong entry fails at build time.
3. **Set a `secret_token` on `setWebhook`** and verify the
   `X-Telegram-Bot-Api-Secret-Token` header on every incoming update.
4. **Rate-limit your own endpoints**. Telegram retries failed webhook
   deliveries — your handler must be idempotent (use `update_id` as the
   dedupe key).
5. **Respect `retry_after`** in `TelegramApiError.parameters` for
   flood-control.

---

## License

MIT © [mr-m-apps](https://github.com/mr-m-apps)
