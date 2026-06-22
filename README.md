# tg-kit

> Professional Telegram library for Mini Apps and Bot API — v4.0.0

**`@mr-m/tg-kit`** is a fully-typed, zero-dependency (at runtime) SDK that covers every aspect of the Telegram ecosystem:

- **Mini App SDK** — TypeScript types verified against the official [Telegram Bot API 9.6](https://core.telegram.org/bots/api) (June 2026)
- **React hooks & providers** — 30+ hooks, `TelegramProvider`, `FullscreenProvider`
- **Bot API client** — server-side `TelegramBot` class with all methods
- **CDN loader** — preload the Telegram script with a single call
- **Dev mode** — full WebApp mock so you can build Mini Apps outside Telegram
- **Multi-format build** — ESM, CJS, IIFE (browser `<script>`) and `.d.ts` declarations

---

[![NPM Version](https://img.shields.io/npm/v/@mr-m/tg-kit)](https://www.npmjs.com/package/@mr-m/tg-kit)
[![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-18%2B-blue.svg)](#peerDependencies)
[![Donate TON](https://img.shields.io/badge/Donate-TON-0098EA)](#support-the-project)

## Installation

```bash
# npm
npm install @mr-m/tg-kit

# pnpm
pnpm add @mr-m/tg-kit

# yarn
yarn add @mr-m/tg-kit
```

React is an optional peer dependency. Install it only if you use hooks or providers:

```bash
npm install react react-dom
```

---

## Entry Points

| Import path | Contents |
|---|---|
| `@mr-m/tg-kit` | Types, hooks, providers, core utils |
| `@mr-m/tg-kit/bot` | `TelegramBot` server-side client |
| `@mr-m/tg-kit/cdn` | CDN script loader helpers |
| `@mr-m/tg-kit/dev` | Dev-mode mock WebApp |
| `@mr-m/tg-kit/core` | Imperative core utils (no React) |

---

## Quick Start

### React Mini App

```tsx
import { TelegramProvider, useTelegram, useHapticFeedback, useTelegramMainButton } from '@mr-m/tg-kit';

function App() {
  const { user, colorScheme } = useTelegram();
  const { impact } = useHapticFeedback();

  useTelegramMainButton({
    text: 'Continue',
    onClick: () => impact('medium'),
  });

  return <div className={colorScheme}>Hello, {user?.first_name}!</div>;
}

export default function Root() {
  return (
    <TelegramProvider options={{ autoExpand: true }}>
      <App />
    </TelegramProvider>
  );
}
```

### Vanilla JS / HTML

Add the IIFE bundle to your HTML:

```html
<script src="https://unpkg.com/@mr-m/tg-kit/dist/browser.global.js"></script>
<script>
  const { getWebApp, isInTelegram } = TgKit;
  if (isInTelegram()) {
    getWebApp().expand();
  }
</script>
```

### Node.js Bot (ESM)

```ts
import { TelegramBot } from '@mr-m/tg-kit/bot';

const bot = new TelegramBot({ token: process.env.BOT_TOKEN! });

const me = await bot.getMe();
console.log('Bot:', me.username);

await bot.sendMessage({
  chat_id: 123456789,
  text: 'Hello from tg-kit!',
});
```

### Node.js Bot (CJS)

```js
const { TelegramBot } = require('@mr-m/tg-kit/bot');

const bot = new TelegramBot({ token: process.env.BOT_TOKEN });
```

---

## TelegramProvider

Wraps your app and provides context about the current Telegram environment.

```tsx
import { TelegramProvider } from '@mr-m/tg-kit';

<TelegramProvider
  options={{
    autoExpand: true,
    autoDisableVerticalSwipes: true,
    autoEnableClosingConfirmation: false,
    allowOutsideTelegram: false,
    loadingComponent: <Spinner />,
    notInTelegramComponent: <NotAvailable />,
    onReady: (webApp) => console.log('version:', webApp.version),
    onUserReady: (user) => analytics.identify(user.id),
  }}
>
  <App />
</TelegramProvider>
```

### `useTelegram()`

```tsx
const {
  ready,          // boolean — init complete
  inTelegram,     // boolean — running inside Telegram
  isDevBypass,    // boolean — dev mock active
  webApp,         // TgWebApp | null
  user,           // TgUser | null
  colorScheme,    // 'light' | 'dark'
  startParam,     // string | null — ?startapp= value
} = useTelegram();
```

---

## React Hooks Reference

### Core

| Hook | Description |
|---|---|
| `useTelegramWebApp()` | Returns the raw `TgWebApp` object |
| `useTelegramUser()` | Returns `TgUser | null` |
| `useTelegramStartParam()` | Returns the `start_param` string |
| `useTelegramEvent(type, handler)` | Subscribes to a WebApp event |
| `useTelegramTheme()` | `{ colorScheme, themeParams, isDark }` |
| `useTelegramViewport()` | `{ height, stableHeight, isExpanded, expand }` |
| `useIsActive()` | `boolean` — app is in foreground |

### Buttons

```tsx
useTelegramMainButton({
  text: 'Pay $9.99',
  onClick: handlePay,
  isVisible: true,
  isActive: !loading,
  color: '#2AABEE',
  textColor: '#ffffff',
  hasShineEffect: true,
  showProgress: loading,
});

useTelegramSecondaryButton({
  text: 'Cancel',
  onClick: handleCancel,
  position: 'left', // 'left' | 'right' | 'top' | 'bottom'
});

useTelegramBackButton({ pathname, onBack: () => navigate(-1) });
useTelegramSettingsButton(() => openSettings());
```

### Haptic Feedback

```tsx
const { impact, notification, selectionChanged } = useHapticFeedback();

impact('light');         // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
notification('success'); // 'error' | 'success' | 'warning'
selectionChanged();
```

### Fullscreen

```tsx
const { isFullscreen, enter, exit, toggle, error } = useTelegramFullscreen();
```

```tsx
// FullscreenProvider (wraps the whole app for CSS variable injection)
<FullscreenProvider options={{ persistPreference: true }}>
  <App />
</FullscreenProvider>
```

CSS variables auto-set:
- `--tg-safe-area-inset-top/bottom/left/right`
- `--tg-content-safe-area-inset-top/bottom/left/right`

### Safe Area

```tsx
const { safeArea, contentSafeArea } = useSafeArea();
// safeArea.top, safeArea.bottom, safeArea.left, safeArea.right (px numbers)
```

### Storage

#### CloudStorage (synced to Telegram servers)

```tsx
const { setItem, getItem, getItems, removeItem, removeItems, getKeys } = useCloudStorage();

await setItem('token', 'abc123');
const token = await getItem('token');
const all = await getKeys();
```

#### DeviceStorage (Bot API 9.0+, local device)

```tsx
const { setItem, getItem, removeItem, clear } = useDeviceStorage();
```

#### SecureStorage (Bot API 9.0+, encrypted)

```tsx
const { setItem, getItem, removeItem, clear, restoreItem } = useSecureStorage();
const { value, canRestore } = await getItem('secret');
if (canRestore) await restoreItem('secret');
```

### Biometric Authentication

```tsx
const { isInited, isAvailable, biometricType, init, requestAccess, authenticate } = useBiometric();

await init();
const granted = await requestAccess('Authenticate to continue');
if (granted) {
  const { authenticated, token } = await authenticate('Confirm purchase');
}
```

### Location

```tsx
const { locationData, isGranted, init, getLocation } = useLocation();

await init();
const loc = await getLocation();
// loc.latitude, loc.longitude, loc.altitude, loc.speed, ...
```

### Sensors

```tsx
const { x, y, z, isStarted, start, stop } = useAccelerometer({ refreshRate: 60, autoStart: true });
const { x, y, z } = useGyroscope({ refreshRate: 100 });
const { alpha, beta, gamma, absolute } = useDeviceOrientation({ needAbsolute: true });
```

### Orientation Lock

```tsx
const { isLocked, lock, unlock } = useOrientationLock();
```

### Home Screen

```tsx
const { status, addToHomeScreen, checkHomeScreenStatus } = useHomeScreen();
// status: 'unsupported' | 'unknown' | 'added' | 'missed'
```

### Sharing & Actions

```tsx
const shareToStory = useShareToStory();
shareToStory('https://example.com/image.jpg', { text: 'Check this out!' });

const shareMessage = useShareMessage();
await shareMessage(preparedMessageId);

const setEmojiStatus = useSetEmojiStatus();
await setEmojiStatus('5361800992937833624', { duration: 3600 });

const requestEmojiStatusAccess = useRequestEmojiStatusAccess();
const granted = await requestEmojiStatusAccess();

const downloadFile = useDownloadFile();
await downloadFile({ url: 'https://example.com/file.pdf', file_name: 'document.pdf' });

const requestWriteAccess = useRequestWriteAccess();
const switchInlineQuery = useSwitchInlineQuery();
const requestContact = useRequestContact();

const requestChat = useRequestChat();
const ok = await requestChat({ request_id: 1, chat_is_channel: false });

const hideKeyboard = useHideKeyboard();
```

---

## Core Utilities (no React)

```ts
import {
  getWebApp,
  isInTelegram,
  isVersionAtLeast,
  getUserDisplayName,
  getUserAvatarUrl,
  openExternalLink,
  openTelegramLink,
  openInvoice,
  haptic,
  cloudStorage,
  deviceStorage,
  secureStorage,
  dialog,
  readClipboard,
  scanQr,
  biometric,
  location,
} from '@mr-m/tg-kit/core';

const wa = getWebApp();
isInTelegram();               // boolean
isVersionAtLeast('7.0');      // boolean

const name = getUserDisplayName(wa?.initDataUnsafe?.user);

haptic.impact('heavy');
haptic.notification('success');
haptic.selectionChanged();

await cloudStorage.setItem('key', 'value');
const val = await cloudStorage.getItem('key');

await dialog.alert('Hello!');
const confirmed = await dialog.confirm('Are you sure?');
const answer = await dialog.prompt('Enter your name', 'Default');

const text = await readClipboard();
const qr = await scanQr({ text: 'Scan QR code' });

openExternalLink('https://example.com');
openTelegramLink('https://t.me/username');
```

---

## CDN Preloading

Use before your app loads to guarantee `window.Telegram.WebApp` is available:

```ts
import { loadTelegramScript, injectTelegramScriptTag } from '@mr-m/tg-kit/cdn';

// Programmatic preload
await loadTelegramScript({ async: true });

// Server-side HTML injection (SSR / Next.js)
const tag = injectTelegramScriptTag({ async: true, defer: false });
// → <script src="https://telegram.org/js/telegram-web-app.js" async></script>
```

---

## Dev Mode (Mini Apps only)

Enable a full WebApp mock so you can develop outside Telegram:

```ts
import { installDevMode, isDevMode } from '@mr-m/tg-kit/dev';

if (process.env.NODE_ENV === 'development') {
  installDevMode({
    user: {
      id: 123456789,
      first_name: 'Alice',
      last_name: 'Smith',
      username: 'alice',
      language_code: 'en',
      is_premium: true,
    },
    colorScheme: 'dark',
    platform: 'tdesktop',
    startParam: 'ref_abc',
    showIndicator: true, // visual badge "DEV MODE"
  });
}
```

Dev mode is automatically enabled when:
- `NODE_ENV === 'development'`, OR
- The URL contains `?tg_dev` query param

`isDevMode()` — returns `true` when the mock is active.

---

## Bot API Client

```ts
import { TelegramBot, TelegramApiError } from '@mr-m/tg-kit/bot';

const bot = new TelegramBot({
  token: process.env.BOT_TOKEN!,
  apiBase: 'https://api.telegram.org', // optional
  timeout: 30000,                       // ms, optional
});

// All Bot API 9.6 methods are available:
await bot.sendMessage({ chat_id, text: 'Hello!' });
await bot.sendPhoto({ chat_id, photo: 'file_id_or_url', caption: 'Caption' });
await bot.sendInvoice({ chat_id, title: 'Premium', description: '...', payload: 'x', currency: 'XTR', prices: [{ label: 'Total', amount: 100 }] });
await bot.answerCallbackQuery({ callback_query_id: id, text: 'Done!' });
await bot.editMessageText({ chat_id, message_id, text: 'Updated' });
await bot.deleteMessage({ chat_id, message_id });
await bot.sendSticker({ chat_id, sticker: 'CAA...' });
await bot.setChatTitle({ chat_id, title: 'New Title' });
await bot.promoteChatMember({ chat_id, user_id, can_manage_video_chats: true });
await bot.createForumTopic({ chat_id, name: 'Support' });
await bot.sendGame({ chat_id, game_short_name: 'mygame' });

// Helper: get file with download URL
const { file_path, downloadUrl } = await bot.getFileWithUrl('BQACAgI...');

// Error handling
try {
  await bot.sendMessage({ chat_id: 0, text: 'test' });
} catch (err) {
  if (err instanceof TelegramApiError) {
    console.error(err.code, err.message, err.parameters);
  }
}
```

### Available Methods (Bot API 9.6)

**Updates** — `getUpdates`, `setWebhook`, `deleteWebhook`, `getWebhookInfo`

**Messages** — `sendMessage`, `forwardMessage`, `forwardMessages`, `copyMessage`, `copyMessages`, `sendPhoto`, `sendAudio`, `sendDocument`, `sendVideo`, `sendAnimation`, `sendVoice`, `sendVideoNote`, `sendMediaGroup`, `sendLocation`, `sendVenue`, `sendContact`, `sendPoll`, `sendDice`, `sendSticker`, `sendChatAction`, `setMessageReaction`

**Editing** — `editMessageText`, `editMessageCaption`, `editMessageMedia`, `editMessageReplyMarkup`, `stopPoll`, `deleteMessage`, `deleteMessages`, `pinChatMessage`, `unpinChatMessage`, `unpinAllChatMessages`

**Files** — `getFile`, `getFileWithUrl`, `getFileDownloadUrl`, `getUserProfilePhotos`

**Chats** — `getChat`, `getChatAdministrators`, `getChatMemberCount`, `getChatMember`, `banChatMember`, `unbanChatMember`, `restrictChatMember`, `promoteChatMember`, `setChatAdministratorCustomTitle`, `banChatSenderChat`, `unbanChatSenderChat`, `setChatPermissions`, `exportChatInviteLink`, `createChatInviteLink`, `editChatInviteLink`, `revokeChatInviteLink`, `approveChatJoinRequest`, `declineChatJoinRequest`, `setChatPhoto`, `deleteChatPhoto`, `setChatTitle`, `setChatDescription`, `leaveChat`

**Bot Settings** — `getMe`, `logOut`, `close`, `setMyDescription`, `getMyDescription`, `setMyShortDescription`, `getMyShortDescription`, `setMyName`, `getMyName`, `setMyCommands`, `getMyCommands`, `deleteMyCommands`, `getChatMenuButton`, `setChatMenuButton`, `setMyDefaultAdministratorRights`, `getMyDefaultAdministratorRights`

**Inline & Callbacks** — `answerCallbackQuery`, `answerInlineQuery`, `answerWebAppQuery`, `savePreparedInlineMessage`

**Payments** — `sendInvoice`, `createInvoiceLink`, `answerShippingQuery`, `answerPreCheckoutQuery`, `refundStarPayment`, `getStarTransactions`

**Stickers** — `getStickerSet`, `getCustomEmojiStickers`, `createNewStickerSet`, `addStickerToSet`, `setStickerPositionInSet`, `deleteStickerFromSet`, `replaceStickerInSet`, `setStickerEmojiList`, `setStickerKeywords`, `setStickerMaskPosition`, `setStickerSetTitle`, `setStickerSetThumbnail`, `setCustomEmojiStickerSetThumbnail`, `deleteStickerSet`

**Games** — `sendGame`, `setGameScore`, `getGameHighScores`

**Forum Topics** — `createForumTopic`, `editForumTopic`, `closeForumTopic`, `reopenForumTopic`, `deleteForumTopic`, `unpinAllForumTopicMessages`, `hideGeneralForumTopic`, `unhideGeneralForumTopic`, `unpinAllGeneralForumTopicMessages`

---

## TypeScript Types

All types are exported from `@mr-m/tg-kit`:

```ts
import type {
  TgWebApp,
  TgUser,
  TgThemeParams,
  WebAppInitData,
  WebAppEventType,
  TgPlatform,
  BottomButton,
  BackButton,
  HapticFeedback,
  CloudStorage,
  DeviceStorage,
  SecureStorage,
  SafeAreaInset,
  PopupParams,
  LocationData,
  RequestChatParams,
  DownloadFileParams,
  EmojiStatusParams,
  StoryShareParams,
} from '@mr-m/tg-kit';

import type {
  User, Message, Chat, Update,
  InlineKeyboardMarkup, InlineKeyboardButton,
  ReplyKeyboardMarkup, KeyboardButton,
  // ... all Bot API types
} from '@mr-m/tg-kit/bot';
```

---

## Compatibility

| Environment | Support |
|---|---|
| TypeScript | ✅ Full types (strict mode) |
| React 18+ | ✅ Hooks + Providers |
| Node.js 18+ | ✅ Bot API client |
| Vanilla JS | ✅ Core utils + IIFE build |
| HTML `<script>` | ✅ `browser.global.js` → `TgKit.*` |
| Next.js / SSR | ✅ `'use client'` on hooks/providers |
| Vite / Webpack | ✅ ESM tree-shakeable |
| Telegram Bot API | ✅ 9.6 (June 2026) |

---

## Support the Project

If **tg-kit** helps you build better Telegram Mini Apps, Bots, or Telegram-based products, consider supporting the project.

Your support helps fund:

- Ongoing Telegram Bot API updates
- New Mini Apps features and hooks
- Documentation improvements
- Bug fixes and long-term maintenance
- Future open-source tooling for the Telegram ecosystem

### TON Donations

Support the project with Toncoin (TON):

UQBxktI5AXqKPEV3jLBW5LSmFoRNqGbsuiO6e1Tq8A1EB-K4

### Contact

Telegram: @eogri

Questions, feature requests, sponsorships, or business inquiries are always welcome.

Thank you for supporting tg-kit ❤️

## License

MIT © mr-m-apps
