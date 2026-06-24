import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { TelegramBot } from "@mr-m/tg-kit/bot"
import type {
  Update,
  Message,
  CallbackQuery,
  PreCheckoutQuery,
  User,
  Chat,
  SuccessfulPayment,
  InlineKeyboardMarkup,
} from "@mr-m/tg-kit/bot"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ""
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || ""
const WEBHOOK_PATH = "/api/webhook"

if (!BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required")
if (!WEBHOOK_SECRET) throw new Error("TELEGRAM_WEBHOOK_SECRET is required")
if (!WEBHOOK_URL) throw new Error("WEBHOOK_URL is required")

const bot = new TelegramBot({ token: BOT_TOKEN, timeout: 15000 })

async function handleStart(message: Message): Promise<void> {
  await bot.sendChatAction({ chat_id: message.chat.id, action: "typing" })
  await bot.sendMessage({
    chat_id: message.chat.id,
    text: `👋 Hello ${message.from?.first_name || "there"}! Welcome to the bot.`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔹 Button 1", callback_data: "btn_1" },
          { text: "🔸 Button 2", callback_data: "btn_2" },
        ],
        [{ text: "💰 Buy Premium", callback_data: "buy_premium" }],
      ],
    } satisfies InlineKeyboardMarkup,
  })
}

async function handleHelp(message: Message): Promise<void> {
  await bot.sendMessage({
    chat_id: message.chat.id,
    text: "📋 Available commands:\n/start - Welcome message\n/help - This help",
  })
}

async function handleCallbackQuery(callbackQuery: CallbackQuery): Promise<void> {
  await bot.answerCallbackQuery({
    callback_query_id: callbackQuery.id,
    text: "✅ Done!",
    show_alert: false,
  })

  const chatId = callbackQuery.message?.chat?.id
  const messageId = callbackQuery.message?.message_id
  const data = callbackQuery.data

  if (!chatId || !messageId) return

  if (data === "btn_1") {
    await bot.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: "✅ You clicked Button 1",
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 Back", callback_data: "back" }]],
      } satisfies InlineKeyboardMarkup,
    })
  }

  if (data === "btn_2") {
    await bot.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: "✅ You clicked Button 2",
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 Back", callback_data: "back" }]],
      } satisfies InlineKeyboardMarkup,
    })
  }

  if (data === "buy_premium") {
    await bot.sendInvoice({
      chat_id: chatId,
      title: "Premium Subscription",
      description: "Unlock all premium features",
      payload: `premium_${chatId}_${Date.now()}`,
      currency: "XTR",
      prices: [{ label: "Premium", amount: 100 }],
    })
  }

  if (data === "back") {
    await bot.editMessageText({
      chat_id: chatId,
      message_id: messageId,
      text: "👋 Welcome back!",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔹 Button 1", callback_data: "btn_1" },
            { text: "🔸 Button 2", callback_data: "btn_2" },
          ],
          [{ text: "💰 Buy Premium", callback_data: "buy_premium" }],
        ],
      } satisfies InlineKeyboardMarkup,
    })
  }
}

async function handlePreCheckoutQuery(preCheckoutQuery: PreCheckoutQuery): Promise<void> {
  await bot.answerPreCheckoutQuery({
    pre_checkout_query_id: preCheckoutQuery.id,
    ok: true,
  })
}

async function handleSuccessfulPayment(message: Message): Promise<void> {
  const payment = message.successful_payment as SuccessfulPayment
  await bot.sendMessage({
    chat_id: message.chat.id,
    text: `✅ Payment received!\n💰 Amount: ${payment.total_amount / 100} ${payment.currency}\n🆔 Charge ID: ${payment.telegram_payment_charge_id}\n📦 Product: ${payment.invoice_payload}`,
  })
}

async function handleMessage(message: Message): Promise<void> {
  if (message.successful_payment) {
    return handleSuccessfulPayment(message)
  }

  const text = message.text?.trim()
  if (!text) return

  if (text === "/start") {
    return handleStart(message)
  }

  if (text === "/help") {
    return handleHelp(message)
  }

  await bot.sendMessage({
    chat_id: message.chat.id,
    text: `❓ Unknown command: ${text}\nUse /help to see available commands.`,
  })
}

async function dispatchUpdate(update: Update): Promise<void> {
  if (update.message) return handleMessage(update.message)
  if (update.callback_query) return handleCallbackQuery(update.callback_query)
  if (update.pre_checkout_query) return handlePreCheckoutQuery(update.pre_checkout_query)
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const headersList = await headers()
    const secretToken = headersList.get("x-telegram-bot-api-secret-token")

    if (WEBHOOK_SECRET && secretToken !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const update = (await request.json()) as Update
    console.log("📩 Webhook received:", JSON.stringify(update, null, 2))

    await dispatchUpdate(update)
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "set") {
    try {
      const result = await bot.setWebhook({
        url: `${WEBHOOK_URL}${WEBHOOK_PATH}`,
        secret_token: WEBHOOK_SECRET,
      })
      return NextResponse.json({ success: true, result })
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }
  }

  if (action === "info") {
    try {
      const info = await bot.getWebhookInfo()
      return NextResponse.json(info)
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 })
    }
  }

  return NextResponse.json({
    status: "running",
    message: "🤖 Telegram Webhook is running",
    endpoints: {
      webhook: WEBHOOK_PATH,
      setWebhook: `${WEBHOOK_PATH}?action=set`,
      webhookInfo: `${WEBHOOK_PATH}?action=info`,
    },
  })
}
