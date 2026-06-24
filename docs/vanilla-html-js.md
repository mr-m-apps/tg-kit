# 🌐 Vanilla JavaScript / HTML Guide — `@mr-m/tg-kit`

Use `tg-kit` without React, without a build step, or from any framework
(Vue, Svelte, Solid, Alpine, …).

> 🎮 **Live demo:** [`demo/html/`](../demo/html) — a single
> `index.html` page that exercises the full WebApp surface via the IIFE
> bundle.

---

## Two ways to use it

| Approach                          | Best for                          | Entry point             |
|-----------------------------------|-----------------------------------|-------------------------|
| **CDN `<script>`** (IIFE)         | Plain HTML pages, prototypes      | `dist/browser.iife.js`  |
| **ESM import** (`@mr-m/tg-kit/core`) | Vue / Svelte / Solid / TS apps  | `@mr-m/tg-kit/core`     |

---

## Option 1 — Plain HTML with the IIFE bundle

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>My Mini App</title>

  <!-- 1. Telegram WebApp runtime (required) -->
  <script src="https://telegram.org/js/telegram-web-app.js"></script>

  <!-- 2. tg-kit IIFE — exposes `window.TgKit` -->
  <script src="https://unpkg.com/@mr-m/tg-kit/dist/browser.iife.js"></script>
</head>
<body>
  <h1 id="greeting">Loading…</h1>
  <button id="pay">Pay</button>

  <script>
    const {
      getWebApp, isInTelegram, getUserDisplayName,
      haptic, dialog, cloudStorage,
    } = window.TgKit;

    const wa = getWebApp();
    if (wa) wa.ready();

    if (isInTelegram()) {
      const user = wa.initDataUnsafe.user;
      document.getElementById('greeting').textContent =
        `Hello, ${getUserDisplayName(user)} 👋`;
    } else {
      document.getElementById('greeting').textContent =
        'Open this page inside Telegram.';
    }

    document.getElementById('pay').addEventListener('click', async () => {
      haptic.impact('medium');
      const ok = await dialog.confirm('Proceed with payment?');
      if (ok) {
        await cloudStorage.setItem('last_intent', String(Date.now()));
        haptic.notification('success');
      }
    });
  </script>
</body>
</html>
```

### What's on `window.TgKit`?

All `@mr-m/tg-kit/core` utilities, plus the dev/cdn helpers:

```
getWebApp, isInTelegram, isVersionAtLeast,
getRawUserData, getUserDisplayName, getUserIdentifier,
getUserAvatarUrl, getUserInfoWithAvatar,
openExternalLink, openTelegramLink, openInvoice,
switchInlineQuery, hideKeyboard,
haptic, cloudStorage, deviceStorage, secureStorage,
dialog, readClipboard, scanQr,
shareToStory, shareMessage,
setEmojiStatus, requestEmojiStatusAccess,
downloadFile, requestWriteAccess, requestContact, requestChat,
invokeCustomMethod, biometric, location,
loadTelegramScript, getTelegramCdnUrl, injectTelegramScriptTag,
createMockWebApp, installDevMode, isDevMode
```

---

## Option 2 — `@mr-m/tg-kit/core` from ESM

For Vue, Svelte, Solid, or any TS app that's not React. No DOM, no
React — pure imperative helpers.

```ts
import {
  getWebApp,
  isInTelegram,
  haptic,
  dialog,
  cloudStorage,
  biometric,
  location,
  loadTelegramScript,
} from '@mr-m/tg-kit/core';

await loadTelegramScript();
const wa = getWebApp();
wa?.ready();
```

### Vue 3 example

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getWebApp, getUserDisplayName, haptic } from '@mr-m/tg-kit/core';

const name = ref('Guest');
onMounted(() => {
  const wa = getWebApp();
  wa?.ready();
  name.value = getUserDisplayName(wa?.initDataUnsafe?.user);
});

function tap() {
  haptic.impact('light');
}
</script>

<template>
  <h1>Hello, {{ name }}!</h1>
  <button @click="tap">Tap me</button>
</template>
```

### Svelte example

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getWebApp, dialog, cloudStorage } from '@mr-m/tg-kit/core';

  let user = $state(null);

  onMount(() => {
    const wa = getWebApp();
    wa?.ready();
    user = wa?.initDataUnsafe?.user ?? null;
  });

  async function save() {
    const ok = await dialog.confirm('Save?');
    if (ok) await cloudStorage.setItem('greeted', '1');
  }
</script>

<h1>Hi {user?.first_name ?? 'guest'}</h1>
<button onclick={save}>Save</button>
```

---

## Imperative API cheat-sheet

### Detect environment

```ts
isInTelegram();        // boolean
isVersionAtLeast('7.10'); // boolean
```

### User info

```ts
const wa = getWebApp();
const user = wa?.initDataUnsafe?.user;
getUserDisplayName(user);    // "First Last" | "@username" | "User_123"
getUserIdentifier(user);     // username | id | "unknown"
getUserAvatarUrl(user);      // user.photo_url or ui-avatars fallback
getUserInfoWithAvatar();     // { user, avatarUrl, displayName, identifier }
```

### Open links

```ts
openExternalLink('https://example.com', /* tryInstantView */ false);
openTelegramLink('https://t.me/durov');
openInvoice('https://t.me/$invoice_slug'); // → Promise<'paid'|'cancelled'|'failed'|'pending'>
```

### Haptic

```ts
haptic.impact('light' | 'medium' | 'heavy' | 'rigid' | 'soft');
haptic.notification('success' | 'error' | 'warning');
haptic.selection();
```

### Storage

```ts
await cloudStorage.setItem('key', 'value');
const v = await cloudStorage.getItem('key');
const keys = await cloudStorage.getKeys();
await cloudStorage.removeItem('key');
// same shape: deviceStorage, secureStorage
```

### Dialogs

```ts
await dialog.alert('Hi!');
const yes = await dialog.confirm('Sure?');
const id  = await dialog.popup({
  title: 'Choose',
  message: 'Pick one',
  buttons: [
    { id: 'a', type: 'default', text: 'A' },
    { id: 'b', type: 'destructive', text: 'B' },
  ],
});
```

### QR / clipboard / contact

```ts
const text = await scanQr('Scan a QR');
const clip = await readClipboard();
await requestContact();
await requestWriteAccess();
```

### Sharing

```ts
shareToStory('https://your.cdn/image.png', {
  text: 'Look!',
  widget_link: { url: 'https://your-app.com', name: 'Open' },
});
await shareMessage('prepared_message_id');
```

### Biometric

```ts
await biometric.init();
await biometric.requestAccess({ reason: 'Sign in' });
const r = await biometric.authenticate({ reason: 'Confirm' });
// r.authenticated, r.token
```

### Location

```ts
await location.init();
const loc = await location.getLocation();
// { latitude, longitude, altitude, ... } | null
```

---

## Dev mode (no Telegram needed)

Run the page in any browser:

```html
<script src="https://unpkg.com/@mr-m/tg-kit/dist/browser.iife.js"></script>
<script>
  const { installDevMode, isDevMode } = window.TgKit;
  if (!window.Telegram) {
    installDevMode({
      user: { id: 1, first_name: 'Dev', username: 'dev', language_code: 'en' },
      colorScheme: 'dark',
      showIndicator: true,
    });
  }
</script>
```

Auto-enables when the URL contains `?tg_dev`.

---

## Safe-area CSS (recommended for every Mini App)

```css
:root {
  --tg-safe-area-inset-top: 0px;
  --tg-safe-area-inset-bottom: 0px;
  --tg-safe-area-inset-left: 0px;
  --tg-safe-area-inset-right: 0px;
}
body {
  padding-top:    var(--tg-safe-area-inset-top);
  padding-bottom: var(--tg-safe-area-inset-bottom);
}
```

Telegram fills these custom properties automatically at runtime.

---

## Common pitfalls

| Problem                                       | Fix                                                              |
|-----------------------------------------------|------------------------------------------------------------------|
| `window.TgKit is undefined`                   | Load `browser.iife.js` **after** `telegram-web-app.js`.          |
| `wa.initDataUnsafe.user` is `undefined`       | The page wasn't opened from a Telegram button; check `isInTelegram()`. |
| `MainButton` doesn't appear                   | You must call `wa.MainButton.setText(...)` and `.show()` after `wa.ready()`. |
| iOS layout cut off                            | Add `viewport-fit=cover` to `<meta name="viewport">` and use safe-area vars. |
