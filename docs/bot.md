# 🤖 Bot API Guide — `@mr-m/tg-kit/bot`

Everything you need to build a Telegram bot with `tg-kit` on Node.js or
Edge runtimes. Server-side only — **never import this module from
client code**.

> 🎮 **Live demo:** [`demo/bot/`](../demo/bot) — production-shaped
> Express webhook server, ready to deploy to Vercel.

---

## Table of contents

1. [Install & import](#install--import)
2. [`TelegramBot` — the client](#telegrambot--the-client)
3. [Sending messages, media, keyboards](#sending-messages-media-keyboards)
4. [Payments with Telegram Stars](#payments-with-telegram-stars)
5. [Files — upload & download](#files--upload--download)
6. [`Dispatcher` — update routing](#dispatcher--update-routing)
7. [Webhook vs long polling](#webhook-vs-long-polling)
8. [`TelegramPoller`](#telegrampoller)
9. [Error handling](#error-handling)
10. [Full method index](#full-method-index)

---

## Install & import

```bash
npm install @mr-m/tg-kit
```

```ts
import {
  TelegramBot,
  TelegramApiError,
  Dispatcher,
  TelegramPoller,
} from '@mr-m/tg-kit/bot';
```

---

## `TelegramBot` — the client

```ts
const bot = new TelegramBot({
  token: process.env.BOT_TOKEN!,
  apiBase: 'https://api.telegram.org', // override for self-hosted Bot API server
  timeout: 30_000,                     // ms, default 30s
});

const me = await bot.getMe();
console.log(`@${me.username} online`);
```

| Option   | Type   | Default                         |
|----------|--------|---------------------------------|
| `token`  | string | **required**                    |
| `apiBase`| string | `https://api.telegram.org`      |
| `timeout`| number | `30000`                         |

---

## Sending messages, media, keyboards

### Plain text + HTML formatting

```ts
await bot.sendMessage({
  chat_id: 123456789,
  text: '<b>Hello</b> <i>world</i>',
  parse_mode: 'HTML',
});
```

### Inline keyboard + Mini App button

```ts
await bot.sendMessage({
  chat_id,
  text: 'Pick one:',
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Open Mini App', web_app: { url: 'https://your-app.com' } }],
      [
        { text: '👍', callback_data: 'vote:yes' },
        { text: '👎', callback_data: 'vote:no' },
      ],
    ],
  },
});
```

### Media

```ts
await bot.sendPhoto({ chat_id, photo: 'https://picsum.photos/600/400', caption: 'A cat 🐈' });
await bot.sendVideo({ chat_id, video: videoFileIdOrUrl });
await bot.sendAudio({ chat_id, audio: audioUrl });
await bot.sendDocument({ chat_id, document: docUrl });
await bot.sendSticker({ chat_id, sticker: stickerFileId });
await bot.sendLocation({ chat_id, latitude: 24.7136, longitude: 46.6753 });
await bot.sendPoll({
  chat_id,
  question: 'Do you like tg-kit?',
  options: [{ text: 'Yes' }, { text: 'Absolutely' }],
});
await bot.sendDice({ chat_id, emoji: '🎲' });
```

### Edit / delete / pin

```ts
await bot.editMessageText({ chat_id, message_id, text: 'updated' });
await bot.editMessageReplyMarkup({ chat_id, message_id, reply_markup: { inline_keyboard: [] } });
await bot.deleteMessage({ chat_id, message_id });
await bot.pinChatMessage({ chat_id, message_id });
```

### Reactions

```ts
await bot.setMessageReaction({
  chat_id, message_id,
  reaction: [{ type: 'emoji', emoji: '🔥' }],
});
```

---

## Payments with Telegram Stars

```ts
await bot.sendInvoice({
  chat_id,
  title: 'Premium subscription',
  description: 'Unlock everything',
  payload: `order_${chat_id}_${Date.now()}`,
  currency: 'XTR',                 // Telegram Stars
  prices: [{ label: 'Premium', amount: 100 }],
});
```

Handle the pre-checkout query (you **must** answer within 10 seconds):

```ts
dispatcher.onPreCheckoutQuery(async (q) => {
  await bot.answerPreCheckoutQuery({ pre_checkout_query_id: q.id, ok: true });
});
```

After payment Telegram sends a `message.successful_payment` — confirm
delivery to your user there. To refund:

```ts
await bot.refundStarPayment({ user_id, telegram_payment_charge_id });
```

---

## Files — upload & download

### Get a download URL

```ts
const { downloadUrl } = await bot.getFileWithUrl(file_id);
const blob = await fetch(downloadUrl).then((r) => r.blob());
```

### Lower-level

```ts
const file = await bot.getFile(file_id);
const url  = bot.getFileDownloadUrl(file.file_path!);
```

> File URLs include your bot token — treat them as secrets.

---

## `Dispatcher` — update routing

```ts
import { Dispatcher } from '@mr-m/tg-kit/bot';

const me = await bot.getMe();
const dispatcher = new Dispatcher({
  botUsername: me.username,                // so `/start@MyBot` matches in groups
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
  })
  .onInlineQuery(async (q) => {
    await bot.answerInlineQuery({ inline_query_id: q.id, results: [] });
  });
```

### All handler hooks

`onMessage`, `onCommand`, `onEditedMessage`, `onChannelPost`,
`onEditedChannelPost`, `onBusinessMessage`, `onEditedBusinessMessage`,
`onDeletedBusinessMessages`, `onPoll`, `onPollAnswer`,
`onCallbackQuery`, `onInlineQuery`, `onChosenInlineResult`,
`onShippingQuery`, `onPreCheckoutQuery`, `onMyChatMember`,
`onChatMember`, `onChatJoinRequest`, `onChatBoost`,
`onRemovedChatBoost`, `onMessageReaction`, `onMessageReactionCount`,
`onBusinessConnection`, `onPurchasedPaidMedia`.

---

## Webhook vs long polling

### Webhook (recommended for production)

```ts
// Next.js App Router example
import { TelegramBot, Dispatcher } from '@mr-m/tg-kit/bot';

const bot = new TelegramBot({ token: process.env.BOT_TOKEN! });
const dispatcher = new Dispatcher();
// ...register handlers...

export async function POST(req: Request) {
  // ALWAYS verify the secret_token header
  if (req.headers.get('x-telegram-bot-api-secret-token') !== process.env.WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 });
  }
  const update = await req.json();
  await dispatcher.dispatch(update);
  return Response.json({ ok: true });
}
```

Register the webhook once:

```ts
await bot.setWebhook({
  url: 'https://your-app.com/api/telegram/webhook',
  secret_token: process.env.WEBHOOK_SECRET!,
  allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
  drop_pending_updates: true,
});
```

> 👉 Full Express + Vercel webhook reference: [`demo/bot/server.js`](../demo/bot/server.js).

---

## `TelegramPoller`

For local dev or non-public deployments. The constructor takes a
`getUpdates` function (not a `TelegramBot` instance):

```ts
import { TelegramPoller } from '@mr-m/tg-kit/bot';

const poller = new TelegramPoller(
  (params) => bot.getUpdates(params),   // ← function, not `bot`
  dispatcher.toHandler(),
  {
    timeout: 30,
    allowedUpdates: ['message', 'callback_query'],
    onError: (err) => console.error(err),
  }
);

poller.start();
// later: poller.stop();
```

Before polling, make sure no webhook is set:

```ts
await bot.deleteWebhook({ drop_pending_updates: true });
```

---

## Error handling

```ts
import { TelegramApiError } from '@mr-m/tg-kit/bot';

try {
  await bot.sendMessage({ chat_id, text });
} catch (e) {
  if (e instanceof TelegramApiError) {
    console.error(e.errorCode, e.message, e.parameters);

    // Flood-control: respect retry_after
    const retry = e.parameters?.retry_after;
    if (retry) await new Promise((r) => setTimeout(r, retry * 1000));
  }
}
```

| Property      | Type                  |
|---------------|-----------------------|
| `errorCode`   | `number`              |
| `message`     | `string`              |
| `parameters`  | `ResponseParameters?` |

---

## Full method index

`getMe`, `getUserProfilePhotos`, `getFile`, `getFileWithUrl`,
`getFileDownloadUrl`, `sendMessage`, `sendPhoto`, `sendAudio`,
`sendDocument`, `sendVideo`, `sendAnimation`, `sendVoice`,
`sendVideoNote`, `sendSticker`, `sendLocation`, `sendVenue`,
`sendContact`, `sendPoll`, `sendDice`, `sendChatAction`,
`sendMediaGroup`, `sendChecklist`, `editMessageChecklist`,
`forwardMessage`, `forwardMessages`, `copyMessage`, `copyMessages`,
`editMessageText`, `editMessageCaption`, `editMessageMedia`,
`editMessageReplyMarkup`, `editMessageLiveLocation`,
`stopMessageLiveLocation`, `deleteMessage`, `deleteMessages`,
`pinChatMessage`, `unpinChatMessage`, `setMessageReaction`,
`getChat`, `getChatAdministrators`, `getChatMember`,
`getChatMemberCount`, `banChatMember`, `unbanChatMember`,
`restrictChatMember`, `promoteChatMember`, `setChatPermissions`,
`createChatInviteLink`, `editChatInviteLink`, `revokeChatInviteLink`,
`approveChatJoinRequest`, `declineChatJoinRequest`,
`setChatPhoto`, `setChatTitle`, `setChatDescription`, `leaveChat`,
`createChatSubscriptionInviteLink`, `editChatSubscriptionInviteLink`,
`setChatStickerSet`, `deleteChatStickerSet`,
`createForumTopic`, `editForumTopic`, `closeForumTopic`,
`reopenForumTopic`, `deleteForumTopic`, `editGeneralForumTopic`,
`closeGeneralForumTopic`, `reopenGeneralForumTopic`,
`hideGeneralForumTopic`, `unhideGeneralForumTopic`,
`getStickerSet`, `getCustomEmojiStickers`, `uploadStickerFile`,
`createNewStickerSet`, `addStickerToSet`, `setStickerPositionInSet`,
`deleteStickerFromSet`, `replaceStickerInSet`, `setStickerEmojiList`,
`setStickerKeywords`, `setStickerMaskPosition`, `setStickerSetTitle`,
`setStickerSetThumbnail`, `deleteStickerSet`,
`answerInlineQuery`, `answerCallbackQuery`, `answerWebAppQuery`,
`savePreparedInlineMessage`, `answerShippingQuery`,
`answerPreCheckoutQuery`, `sendInvoice`, `createInvoiceLink`,
`refundStarPayment`, `getStarTransactions`, `sendPaidMedia`,
`getAvailableGifts`, `sendGift`,
`getBusinessConnection`, `readBusinessMessage`,
`deleteBusinessMessages`, `getBusinessAccountGifts`,
`getBusinessAccountStarBalance`, `convertGiftToStars`, `upgradeGift`,
`transferGift`, `transferBusinessAccountStars`,
`setBusinessAccountName`, `setBusinessAccountUsername`,
`setBusinessAccountBio`, `setBusinessAccountProfilePhoto`,
`removeBusinessAccountProfilePhoto`,
`setBusinessAccountGiftSettings`, `postStory`, `editStory`,
`deleteStory`, `verifyUser`, `verifyChat`, `removeUserVerification`,
`removeChatVerification`, `setUserEmojiStatus`, `allowUserMessages`,
`disallowUserMessages`, `setMyCommands`, `getMyCommands`,
`deleteMyCommands`, `getChatMenuButton`, `setChatMenuButton`,
`setMyDefaultAdministratorRights`, `getMyDefaultAdministratorRights`,
`setMyName`, `getMyName`, `setMyDescription`, `getMyDescription`,
`setMyShortDescription`, `getMyShortDescription`,
`setWebhook`, `deleteWebhook`, `getWebhookInfo`, `getUpdates`,
`sendGame`, `setGameScore`, `getGameHighScores`,
`setPassportDataErrors`,
`callMethod<T>(method, params)` — escape hatch for any new Bot API
method not yet wrapped.

---

## Security checklist

- [ ] **Never** import `@mr-m/tg-kit/bot` from client code.
- [ ] **Always** set a `secret_token` on `setWebhook` and verify the `X-Telegram-Bot-Api-Secret-Token` header.
- [ ] Treat your webhook handler as **idempotent** — Telegram retries on failure. Dedupe by `update_id`.
- [ ] Honor `retry_after` in `TelegramApiError.parameters`.
- [ ] Bot file download URLs contain the token — never expose them to end users.
