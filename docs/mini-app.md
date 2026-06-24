# 📱 Mini App Guide — `@mr-m/tg-kit` (React)

Build production-grade Telegram Mini Apps with full type safety and 30+
React hooks. SSR-safe by default.

> 🎮 **Live demo:** [`demo/nextjs/`](../demo/nextjs) — Next.js 16 App
> Router with `TelegramProvider`, `FullscreenProvider`, TonConnect, and a
> webhook route.

---

## Table of contents

1. [Install](#install)
2. [Load the WebApp script](#load-the-webapp-script)
3. [`TelegramProvider`](#telegramprovider)
4. [`useTelegram()`](#usetelegram)
5. [Buttons](#buttons)
6. [Theme, viewport, fullscreen, safe area](#theme-viewport-fullscreen-safe-area)
7. [Haptic feedback](#haptic-feedback)
8. [Storage — cloud / device / secure](#storage--cloud--device--secure)
9. [Sensors — accelerometer / gyroscope / orientation](#sensors)
10. [Biometric authentication](#biometric-authentication)
11. [Location](#location)
12. [Dialogs, QR scan, clipboard](#dialogs-qr-scan-clipboard)
13. [Sharing & system requests](#sharing--system-requests)
14. [Server — validate `initData`](#server--validate-initdata)
15. [Dev mode (mock WebApp)](#dev-mode-mock-webapp)
16. [Full Next.js example](#full-nextjs-example)

---

## Install

```bash
npm install @mr-m/tg-kit
# peer dependency (only if you use hooks/providers)
npm install react react-dom
```

---

## Load the WebApp script

The Mini App needs `window.Telegram.WebApp`, which is provided by
Telegram's CDN script. You can load it three ways:

### A. Static `<script>` (Next.js / any framework)

```tsx
// app/layout.tsx (Next.js App Router)
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### B. Programmatic loader (recommended for client-side only apps)

```ts
import { loadTelegramScript, getTelegramCdnUrl } from '@mr-m/tg-kit';

await loadTelegramScript();           // resolves when window.Telegram.WebApp exists
console.log(getTelegramCdnUrl());     // → 'https://telegram.org/js/telegram-web-app.js'
```

### C. Plain HTML (no bundler)

See [`docs/vanilla-html-js.md`](./vanilla-html-js.md).

---

## `TelegramProvider`

Wrap your app once at the root:

```tsx
'use client';
import { TelegramProvider } from '@mr-m/tg-kit';

<TelegramProvider
  options={{
    autoExpand: true,
    autoDisableVerticalSwipes: true,
    autoEnableClosingConfirmation: true,
    allowOutsideTelegram: process.env.NODE_ENV !== 'production',
    loadingComponent: <Spinner />,
    notInTelegramComponent: <OpenInTelegram />,
    onReady: (wa) => console.log('WebApp v', wa.version),
    onUserReady: (user) => console.log('user', user),
  }}
>
  {children}
</TelegramProvider>
```

All options are optional. The provider is SSR-safe — children render
with defaults until the WebApp boots.

---

## `useTelegram()`

```ts
const {
  ready,           // boolean — WebApp.ready() has fired
  inTelegram,      // boolean
  isDevBypass,     // boolean — true when mock WebApp is active
  webApp,          // TgWebApp | null
  user,            // TgUser | null
  colorScheme,     // 'light' | 'dark'
  startParam,      // string | null
} = useTelegram();
```

Granular hooks: `useTelegramWebApp`, `useTelegramUser`,
`useTelegramStartParam`, `useInitData`, `useReady`, `useIsActive`,
`useTelegramEvent(type, fn)`.

---

## Buttons

### Main button

```tsx
useTelegramMainButton({
  text: 'Pay $9.99',
  onClick: handlePay,
  showProgress: loading,        // optional
  color: '#2AABEE',             // optional
  textColor: '#ffffff',         // optional
  isVisible: true,              // default true
  isEnabled: !loading,          // default true
});
```

### Secondary button (Bot API 7.10+)

```tsx
useTelegramSecondaryButton({
  text: 'Cancel',
  onClick: () => navigate(-1),
  position: 'left',             // 'left' | 'right' | 'top' | 'bottom'
});
```

### Back & settings

```tsx
useTelegramBackButton({ pathname, hideOnRoot: true });
useTelegramSettingsButton(() => openSettings());
```

---

## Theme, viewport, fullscreen, safe area

```ts
const { colorScheme, isDark, themeParams } = useTelegramTheme();
const { isExpanded, height, stableHeight, expand } = useTelegramViewport();
const { isFullscreen, enter, exit, toggle } = useTelegramFullscreen();
const { isLocked, lock, unlock } = useOrientationLock();
const { safeArea, contentSafeArea } = useSafeArea();
```

### Apply safe-area CSS variables globally

Add these to your global CSS — Telegram populates them automatically at
runtime, but defining them up-front prevents layout jumps:

```css
:root {
  --tg-safe-area-inset-top: 0px;
  --tg-safe-area-inset-bottom: 0px;
  --tg-safe-area-inset-left: 0px;
  --tg-safe-area-inset-right: 0px;
  --tg-content-safe-area-inset-top: 0px;
  --tg-content-safe-area-inset-bottom: 0px;
  --tg-content-safe-area-inset-left: 0px;
  --tg-content-safe-area-inset-right: 0px;
}

body {
  padding-bottom: calc(16px + var(--tg-safe-area-inset-bottom));
}
```

### `FullscreenProvider`

If many components need fullscreen state, wrap once and read with `useFullscreen()`:

```tsx
<FullscreenProvider options={{ persistPreference: true }}>
  <App />
</FullscreenProvider>
```

---

## Haptic feedback

```ts
const { impact, notification, selectionChanged } = useHapticFeedback();

impact('light');         // 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
notification('success'); // 'success' | 'error' | 'warning'
selectionChanged();
```

---

## Storage — cloud / device / secure

| Hook                  | Storage location              | Min Bot API |
|-----------------------|-------------------------------|-------------|
| `useCloudStorage()`   | per-user, synced by Telegram  | 6.9         |
| `useDeviceStorage()`  | per-device, local             | 9.0         |
| `useSecureStorage()`  | secure enclave                | 9.0         |

```ts
const { setItem, getItem, getItems, removeItem, getKeys } = useCloudStorage();

await setItem('plan', 'premium');
const plan = await getItem('plan');
```

---

## Sensors

```ts
const { x, y, z, isStarted, start, stop } = useAccelerometer({ refreshRate: 60, autoStart: true });
const gyro = useGyroscope();
const orient = useDeviceOrientation({ refreshRate: 60, autoStart: false });
```

---

## Biometric authentication

```ts
const { isAvailable, isAccessGranted, authenticated, token,
        requestAccess, authenticate, updateBiometricToken, openSettings } = useBiometric();

if (isAvailable && !isAccessGranted) {
  await requestAccess({ reason: 'Securely sign in to your account' });
}
const result = await authenticate({ reason: 'Confirm purchase' });
if (result.authenticated) console.log('token:', result.token);
```

---

## Location

```ts
const { isAvailable, isGranted, init, getLocation, openSettings } = useLocation();

await init();
const loc = await getLocation();
if (loc) console.log(loc.latitude, loc.longitude, loc.altitude);
```

---

## Dialogs, QR scan, clipboard

```ts
const alert    = useShowAlert();
const confirm  = useShowConfirm();
const popup    = useShowPopup();
const scanQr   = useScanQrPopup();
const readClip = useReadTextFromClipboard();

await alert('Hi!');
const ok = await confirm('Delete this item?');
const id = await popup({
  title: 'Choose',
  message: 'Pick one',
  buttons: [
    { id: 'a', type: 'default', text: 'A' },
    { id: 'b', type: 'destructive', text: 'B' },
  ],
});
const text = await scanQr({ text: 'Scan a QR code' });
const clip = await readClip();
```

---

## Sharing & system requests

```ts
const shareStory     = useShareToStory();
const shareMessage   = useShareMessage();
const download       = useDownloadFile();
const setEmoji       = useSetEmojiStatus();
const askEmojiAccess = useRequestEmojiStatusAccess();
const askWriteAccess = useRequestWriteAccess();
const askContact     = useRequestContact();
const askChat        = useRequestChat();
const switchInline   = useSwitchInlineQuery();
const hideKeyboard   = useHideKeyboard();
const invoke         = useInvokeCustomMethod();
const home           = useHomeScreen();
```

---

## Server — validate `initData`

**Never trust `initDataUnsafe`.** Send the raw `initData` string to your
server and validate it.

### Node (sync — fastest)

```ts
import { validateInitDataSync } from '@mr-m/tg-kit/server';

const result = validateInitDataSync(initData, process.env.BOT_TOKEN!, {
  maxAgeSeconds: 86_400,
});
if (!result.valid) throw new Error(result.reason);
const user = result.user;
```

### Node or Edge (async)

```ts
import { validateInitData } from '@mr-m/tg-kit/server';

const result = await validateInitData(initData, process.env.BOT_TOKEN!, {
  runtime: 'edge',
  maxAgeSeconds: 3600,
});
```

### All options

```ts
interface ValidateInitDataOptions {
  maxAgeSeconds?: number;     // default 86400
  runtime?: 'node' | 'edge';  // default 'node'
  parseUser?: boolean;
  strict?: boolean;
  skipAuthDateCheck?: boolean;
  extractStartParam?: boolean;
  extractChat?: boolean;
  parseUnsafeData?: boolean;
}
```

---

## Dev mode (mock WebApp)

Develop in a normal browser without Telegram:

```ts
import { installDevMode } from '@mr-m/tg-kit/dev';

if (process.env.NODE_ENV !== 'production') {
  installDevMode({
    user: { id: 1, first_name: 'Dev', username: 'dev', language_code: 'en' },
    colorScheme: 'dark',
    startParam: 'ref_abc',
    showIndicator: true,
  });
}
```

Auto-enables when `?tg_dev` is in the URL.

---

## Full Next.js example

```tsx
// app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useTelegram, useReady, useInitData, useTelegramMainButton } from '@mr-m/tg-kit';

export default function Home() {
  useReady();
  const { user, colorScheme } = useTelegram();
  const initData = useInitData();
  const [me, setMe] = useState<unknown>(null);

  useEffect(() => {
    if (!initData) return;
    fetch('/api/auth', {
      method: 'POST',
      headers: { Authorization: `tma ${initData}` },
    })
      .then((r) => r.json())
      .then(setMe);
  }, [initData]);

  useTelegramMainButton({ text: 'Buy now', onClick: () => alert('🛒') });

  return (
    <main data-theme={colorScheme}>
      <h1>Hi {user?.first_name}</h1>
      <pre>{JSON.stringify(me, null, 2)}</pre>
    </main>
  );
}
```

```ts
// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { validateInitData } from '@mr-m/tg-kit/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const initData = auth.startsWith('tma ') ? auth.slice(4) : '';

  const result = await validateInitData(initData, process.env.BOT_TOKEN!, {
    runtime: 'edge',
    maxAgeSeconds: 3600,
  });

  if (!result.valid) return NextResponse.json({ error: result.reason }, { status: 401 });
  return NextResponse.json(result.user);
}
```

> 👉 A fully-wired version (with `TelegramProvider`, `FullscreenProvider`,
> TonConnect, webhook route, Stars invoice route) lives in
> [`demo/nextjs/`](../demo/nextjs).

---

## Common pitfalls

| Problem                                          | Fix                                                                 |
|--------------------------------------------------|---------------------------------------------------------------------|
| `window.Telegram is undefined` in Next.js        | Add `'use client'`; the script must be loaded before hooks run.     |
| `initData` validation fails with `expired`        | Increase `maxAgeSeconds` (default 1 day).                          |
| Bot token leaked in client bundle                | Never import `/bot` or `/server` from client code.                  |
| Mini App opens at 0 height on iOS                | Set `viewport-fit=cover` in your `<meta name="viewport">`.          |
| Buttons don't appear in dev mode                 | Use `installDevMode()` and reload — the mock paints a floating UI. |
