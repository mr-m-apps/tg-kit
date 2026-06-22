import crypto from 'node:crypto';
import express from 'express';
import { TelegramBot, TelegramApiError } from '@mr-m/tg-kit/bot';

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_PATH = process.env.WEBHOOK_PATH || '/telegram/webhook';
const SECRET_TOKEN = process.env.SECRET_TOKEN;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN environment variable is required');
if (!WEBHOOK_URL) throw new Error('WEBHOOK_URL environment variable is required');
if (!SECRET_TOKEN) throw new Error('SECRET_TOKEN environment variable is required');

const bot = new TelegramBot({ token: BOT_TOKEN, timeout: 15000 });

function verifySecretToken(header) {
  if (!header) return false;
  const expected = Buffer.from(SECRET_TOKEN);
  const received = Buffer.from(header);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

async function handleStart(message) {
  await bot.sendChatAction({ chat_id: message.chat.id, action: 'typing' });
  await bot.sendMessage({
    chat_id: message.chat.id,
    text: `Hello ${message.from?.first_name ?? 'there'}, this is a tg-kit webhook bot demo.`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Open Mini App', web_app: { url: 'https://example.com' } },
          { text: 'Docs', url: 'https://github.com/mr-m-apps/tg-kit' }
        ],
        [{ text: 'Open menu', callback_data: 'menu_open' }]
      ]
    }
  });
}

async function handleHelp(message) {
  await bot.sendMessage({
    chat_id: message.chat.id,
    text: [
      '/start - welcome message with an inline keyboard',
      '/help - this list',
      '/photo - send a sample photo',
      '/location - send a sample location',
      '/poll - send a sample poll',
      '/dice - send a dice animation',
      '/invoice - send a Telegram Stars invoice',
      '/sticker - send a sample sticker'
    ].join('\n')
  });
}

async function handlePhoto(message) {
  await bot.sendChatAction({ chat_id: message.chat.id, action: 'upload_photo' });
  await bot.sendPhoto({
    chat_id: message.chat.id,
    photo: 'https://picsum.photos/600/400',
    caption: 'Sent with bot.sendPhoto()'
  });
}

async function handleLocation(message) {
  await bot.sendChatAction({ chat_id: message.chat.id, action: 'find_location' });
  await bot.sendLocation({
    chat_id: message.chat.id,
    latitude: 24.7136,
    longitude: 46.6753
  });
}

async function handlePoll(message) {
  await bot.sendPoll({
    chat_id: message.chat.id,
    question: 'Do you like tg-kit?',
    options: [{ text: 'Yes' }, { text: 'Absolutely' }, { text: 'Needs more features' }],
    is_anonymous: false
  });
}

async function handleDice(message) {
  await bot.sendDice({ chat_id: message.chat.id, emoji: '🎲' });
}

async function handleInvoice(message) {
  await bot.sendInvoice({
    chat_id: message.chat.id,
    title: 'tg-kit Premium',
    description: 'Unlock premium features',
    payload: `order_${message.chat.id}_${Date.now()}`,
    currency: 'XTR',
    prices: [{ label: 'Premium', amount: 100 }]
  });
}

async function handleSticker(message) {
  await bot.sendSticker({
    chat_id: message.chat.id,
    sticker: 'CAACAgIAAxkBAAEXAMPLE'
  });
}

async function handleIncomingFile(message) {
  const fileId = message.document?.file_id ?? message.photo?.at(-1)?.file_id;
  if (!fileId) return;
  const file = await bot.getFileWithUrl(fileId);
  await bot.sendMessage({
    chat_id: message.chat.id,
    text: `File received, download link: ${file.downloadUrl}`
  });
}

async function handleSuccessfulPayment(message) {
  await bot.sendMessage({
    chat_id: message.chat.id,
    text: `Payment received, charge id: ${message.successful_payment.telegram_payment_charge_id}`
  });
}

const commands = {
  '/start': handleStart,
  '/help': handleHelp,
  '/photo': handlePhoto,
  '/location': handleLocation,
  '/poll': handlePoll,
  '/dice': handleDice,
  '/invoice': handleInvoice,
  '/sticker': handleSticker
};

async function handleMessage(message) {
  if (message.successful_payment) return handleSuccessfulPayment(message);
  if (message.document || message.photo) return handleIncomingFile(message);
  const text = message.text?.trim();
  if (!text) return;
  const command = text.split(' ')[0];
  const handler = commands[command];
  if (handler) return handler(message);
  await bot.sendMessage({ chat_id: message.chat.id, text: `Unknown command: ${command}. Try /help.` });
}

async function handleCallbackQuery(callbackQuery) {
  await bot.answerCallbackQuery({ callback_query_id: callbackQuery.id, text: 'Got it', show_alert: false });
  if (!callbackQuery.message) return;
  if (callbackQuery.data === 'menu_open') {
    await bot.editMessageText({
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      text: 'Menu updated with bot.editMessageText()',
      reply_markup: { inline_keyboard: [[{ text: 'Close', callback_data: 'menu_close' }]] }
    });
  }
  if (callbackQuery.data === 'menu_close') {
    await bot.editMessageReplyMarkup({
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
      reply_markup: { inline_keyboard: [] }
    });
  }
}

async function handleInlineQuery(inlineQuery) {
  await bot.answerInlineQuery({
    inline_query_id: inlineQuery.id,
    results: [
      {
        type: 'article',
        id: '1',
        title: 'tg-kit',
        description: 'Professional Telegram library for Mini Apps and Bot API',
        input_message_content: { message_text: 'Sent via bot.answerInlineQuery()' }
      }
    ],
    cache_time: 0
  });
}

async function handlePreCheckoutQuery(preCheckoutQuery) {
  await bot.answerPreCheckoutQuery({ pre_checkout_query_id: preCheckoutQuery.id, ok: true });
}

async function handleShippingQuery(shippingQuery) {
  await bot.answerShippingQuery({
    shipping_query_id: shippingQuery.id,
    ok: true,
    shipping_options: [
      { id: 'standard', title: 'Standard shipping', prices: [{ label: 'Shipping', amount: 0 }] }
    ]
  });
}

async function dispatchUpdate(update) {
  if (update.message) return handleMessage(update.message);
  if (update.callback_query) return handleCallbackQuery(update.callback_query);
  if (update.inline_query) return handleInlineQuery(update.inline_query);
  if (update.pre_checkout_query) return handlePreCheckoutQuery(update.pre_checkout_query);
  if (update.shipping_query) return handleShippingQuery(update.shipping_query);
}

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.post(WEBHOOK_PATH, async (req, res) => {
  const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
  const token = Array.isArray(secretHeader) ? secretHeader[0] : secretHeader;

  if (!verifySecretToken(token)) {
    return res.status(401).end();
  }

  res.status(200).end();

  try {
    await dispatchUpdate(req.body);
  } catch (error) {
    if (error instanceof TelegramApiError) {
      console.error('Telegram API error', error.code, error.message, error.parameters);
    } else {
      console.error('Webhook handler error', error);
    }
  }
});

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  const PORT = Number(process.env.PORT || 8080);

  const me = await bot.getMe();
  console.log(`Logged in as @${me.username}`);

  await bot.setMyCommands({
    commands: [
      { command: 'start', description: 'Welcome message' },
      { command: 'help', description: 'List available commands' },
      { command: 'photo', description: 'Send a sample photo' },
      { command: 'location', description: 'Send a sample location' },
      { command: 'poll', description: 'Send a sample poll' },
      { command: 'dice', description: 'Send a dice animation' },
      { command: 'invoice', description: 'Send a Telegram Stars invoice' },
      { command: 'sticker', description: 'Send a sample sticker' }
    ]
  });

  await bot.setChatMenuButton({ menu_button: { type: 'commands' } });

  await bot.setWebhook({
    url: `${WEBHOOK_URL}${WEBHOOK_PATH}`,
    secret_token: SECRET_TOKEN,
    allowed_updates: ['message', 'callback_query', 'inline_query', 'pre_checkout_query', 'shipping_query'],
    drop_pending_updates: true
  });

  const info = await bot.getWebhookInfo();
  console.log(`Webhook set to ${info.url}`);

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} at ${WEBHOOK_PATH}`);
  });
}

export default app;
